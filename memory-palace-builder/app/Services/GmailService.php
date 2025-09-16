<?php

namespace App\Services;

use Google\Client;
use Google\Service\Gmail;

class GmailService
{
    private $client;
    private $gmail;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
        $this->client->setRedirectUri(config('services.google.redirect'));
        $this->client->addScope(Gmail::GMAIL_READONLY);
    }

    public function getRecentEmails($accessToken, $maxResults = 10)
    {
        $this->client->setAccessToken($accessToken);
        $this->gmail = new Gmail($this->client);

        $messages = $this->gmail->users_messages->listUsersMessages('me', [
            'maxResults' => $maxResults,
            'q' => 'in:inbox'
        ]);

        $emails = [];
        foreach ($messages->getMessages() as $message) {
            $email = $this->gmail->users_messages->get('me', $message->getId());
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

    private function getEmailBody($payload)
    {
        $body = '';
        if ($payload->getParts()) {
            foreach ($payload->getParts() as $part) {
                if ($part->getMimeType() === 'text/plain') {
                    $body = base64_decode(str_replace(['-', '_'], ['+', '/'], $part->getBody()->getData()));
                    break;
                }
            }
        } else {
            $body = base64_decode(str_replace(['-', '_'], ['+', '/'], $payload->getBody()->getData()));
        }
        return $body;
    }
}