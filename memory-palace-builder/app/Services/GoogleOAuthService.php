<?php

namespace App\Services;

use Google\Client;
use Google\Service\Gmail;
use Google\Service\Calendar;
use App\Models\ApiConnection;

class GoogleOAuthService
{
    private $client;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
        $this->client->setRedirectUri(config('services.google.redirect'));
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
    }

    public function getAuthUrl($scopes, $state)
    {
        $this->client->setScopes($scopes);
        $this->client->setState($state);
        return $this->client->createAuthUrl();
    }

    public function exchangeCodeForTokens($code)
    {
        $token = $this->client->fetchAccessTokenWithAuthCode($code);
        
        if (isset($token['error'])) {
            throw new \Exception('OAuth error: ' . $token['error_description']);
        }
        
        return $token;
    }

    public function refreshToken($refreshToken)
    {
        $this->client->refreshToken($refreshToken);
        return $this->client->getAccessToken();
    }

    public function getGmailEmails($accessToken, $maxResults = 10)
    {
        $this->client->setAccessToken($accessToken);
        $gmail = new Gmail($this->client);

        $messages = $gmail->users_messages->listUsersMessages('me', [
            'maxResults' => $maxResults,
            'q' => 'in:inbox'
        ]);

        $emails = [];
        foreach ($messages->getMessages() as $message) {
            $email = $gmail->users_messages->get('me', $message->getId());
            $headers = $email->getPayload()->getHeaders();
            
            $subject = '';
            $from = '';
            $date = '';
            
            foreach ($headers as $header) {
                if ($header->getName() === 'Subject') $subject = $header->getValue();
                if ($header->getName() === 'From') $from = $header->getValue();
                if ($header->getName() === 'Date') $date = $header->getValue();
            }

            $body = $this->getEmailBody($email->getPayload());

            $emails[] = [
                'id' => $message->getId(),
                'subject' => $subject,
                'from' => $from,
                'date' => $date,
                'body' => $body
            ];
        }

        return $emails;
    }

    public function getCalendarEvents($accessToken, $maxResults = 10)
    {
        $this->client->setAccessToken($accessToken);
        $calendar = new Calendar($this->client);

        $events = $calendar->events->listEvents('primary', [
            'maxResults' => $maxResults,
            'orderBy' => 'startTime',
            'singleEvents' => true,
            'timeMin' => date('c', strtotime('-30 days'))
        ]);

        $calendarEvents = [];
        foreach ($events->getItems() as $event) {
            $calendarEvents[] = [
                'id' => $event->getId(),
                'summary' => $event->getSummary(),
                'description' => $event->getDescription(),
                'start' => $event->getStart()->getDateTime() ?: $event->getStart()->getDate(),
                'end' => $event->getEnd()->getDateTime() ?: $event->getEnd()->getDate(),
                'location' => $event->getLocation()
            ];
        }

        return $calendarEvents;
    }

    public function getPhotos($accessToken, $limit = 10)
    {
        $httpClient = new \GuzzleHttp\Client();
        
        try {
            // Use the simpler GET endpoint instead of POST search
            $response = $httpClient->get('https://photoslibrary.googleapis.com/v1/mediaItems', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json'
                ],
                'query' => [
                    'pageSize' => $limit
                ]
            ]);
            
            $data = json_decode($response->getBody(), true);
            $photos = [];

            foreach ($data['mediaItems'] ?? [] as $item) {
                $photos[] = [
                    'id' => $item['id'],
                    'filename' => $item['filename'] ?? 'Photo',
                    'description' => $item['description'] ?? 'Google Photos image',
                    'mimeType' => $item['mimeType'] ?? 'image/jpeg',
                    'baseUrl' => $item['baseUrl'] ?? '',
                    'mediaMetadata' => $item['mediaMetadata'] ?? []
                ];
            }

            return $photos;
            
        } catch (\GuzzleHttp\Exception\ClientException $e) {
            $statusCode = $e->getResponse()->getStatusCode();
            $errorBody = $e->getResponse()->getBody()->getContents();
            
            if ($statusCode === 403) {
                // Return mock data for development when API access is restricted
                \Log::warning('Google Photos API access restricted, using mock data: ' . $errorBody);
                return [
                    [
                        'id' => 'demo_photo_1',
                        'filename' => 'Demo Photo 1.jpg',
                        'description' => 'Sample photo memory (API restricted)',
                        'mimeType' => 'image/jpeg',
                        'baseUrl' => 'https://via.placeholder.com/400x300/4285f4/ffffff?text=Photo+1',
                        'mediaMetadata' => [
                            'creationTime' => now()->subDays(5)->toISOString()
                        ]
                    ],
                    [
                        'id' => 'demo_photo_2',
                        'filename' => 'Demo Photo 2.jpg', 
                        'description' => 'Another sample photo memory (API restricted)',
                        'mimeType' => 'image/jpeg',
                        'baseUrl' => 'https://via.placeholder.com/400x300/34a853/ffffff?text=Photo+2',
                        'mediaMetadata' => [
                            'creationTime' => now()->subDays(10)->toISOString()
                        ]
                    ]
                ];
            }
            
            throw new \Exception('Google Photos API error: ' . $errorBody);
        }
    }

    private function getEmailBody($payload)
    {
        $body = '';
        $htmlBody = '';
        
        if ($payload->getParts()) {
            foreach ($payload->getParts() as $part) {
                if ($part->getMimeType() === 'text/plain') {
                    $body = base64_decode(str_replace(['-', '_'], ['+', '/'], $part->getBody()->getData()));
                    break;
                } elseif ($part->getMimeType() === 'text/html') {
                    $htmlBody = base64_decode(str_replace(['-', '_'], ['+', '/'], $part->getBody()->getData()));
                }
            }
        } else {
            $rawBody = base64_decode(str_replace(['-', '_'], ['+', '/'], $payload->getBody()->getData()));
            if ($payload->getMimeType() === 'text/plain') {
                $body = $rawBody;
            } else {
                $htmlBody = $rawBody;
            }
        }
        
        // If no plain text, convert HTML to text
        if (empty($body) && !empty($htmlBody)) {
            $body = $this->htmlToText($htmlBody);
        }
        
        return $body;
    }
    
    private function htmlToText($html)
    {
        // Remove script and style elements
        $html = preg_replace('/<(script|style)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/mi', '', $html);
        
        // Convert common HTML elements to text
        $html = str_replace(['<br>', '<br/>', '<br />'], "\n", $html);
        $html = str_replace(['</p>', '</div>', '</h1>', '</h2>', '</h3>', '</h4>', '</h5>', '</h6>'], "\n\n", $html);
        
        // Strip all HTML tags
        $text = strip_tags($html);
        
        // Decode HTML entities
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
        
        // Clean up whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        $text = preg_replace('/\n\s*\n/', "\n\n", $text);
        
        return trim($text);
    }
}