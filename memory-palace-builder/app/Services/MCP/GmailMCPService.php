<?php

namespace App\Services\MCP;

use Carbon\Carbon;

class GmailMCPService extends BaseMCPService
{
    protected function getProviderName(): string
    {
        return 'google';
    }

    protected function getBaseUrl(): string
    {
        return 'https://gmail.googleapis.com/gmail/v1';
    }

    protected function getRequiredScopes(): array
    {
        return [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.labels',
        ];
    }

    protected function getTokenRefreshUrl(): string
    {
        return 'https://oauth2.googleapis.com/token';
    }

    public function fetchData(array $options = []): array
    {
        $this->logSyncActivity('fetch_start', $options);

        $results = [];
        
        try {
            // Get user profile
            $profile = $this->makeAuthenticatedRequest('users/me/profile');
            
            // Fetch recent emails (last 30 days by default)
            $since = $options['since'] ?? now()->subDays(30)->format('Y/m/d');
            $maxResults = $options['max_results'] ?? 100;
            
            $query = "after:{$since}";
            if (isset($options['query'])) {
                $query .= ' ' . $options['query'];
            }
            
            $messages = $this->makeAuthenticatedRequest('users/me/messages', [
                'query' => ['q' => $query, 'maxResults' => $maxResults]
            ]);
            
            $results['profile'] = $profile;
            $results['messages'] = [];
            
            // Fetch full message details
            foreach ($messages['messages'] ?? [] as $message) {
                $messageDetails = $this->makeAuthenticatedRequest(
                    "users/me/messages/{$message['id']}"
                );
                $results['messages'][] = $messageDetails;
                
                // Rate limiting - respect API limits
                usleep(100000); // 100ms delay between requests
            }
            
            // Get labels
            $labels = $this->makeAuthenticatedRequest('users/me/labels');
            $results['labels'] = $labels['labels'] ?? [];
            
            $this->updateLastSync();
            $this->logSyncActivity('fetch_complete', [
                'message_count' => count($results['messages']),
                'label_count' => count($results['labels'])
            ]);
            
            return $results;
            
        } catch (\Exception $e) {
            $this->logSyncActivity('fetch_error', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function transformToMemories(array $data): array
    {
        $memories = [];
        
        foreach ($data['messages'] ?? [] as $message) {
            $headers = $this->parseHeaders($message['payload']['headers'] ?? []);
            $body = $this->extractMessageBody($message['payload']);
            
            $memory = [
                'type' => 'email',
                'title' => $headers['Subject'] ?? 'No Subject',
                'content' => $body,
                'external_id' => $message['id'],
                'external_url' => "https://mail.google.com/mail/u/0/#inbox/{$message['id']}",
                'memory_date' => $this->parseDate($headers['Date'] ?? null),
                'raw_data' => $message,
                'metadata' => [
                    'from' => $headers['From'] ?? null,
                    'to' => $headers['To'] ?? null,
                    'cc' => $headers['Cc'] ?? null,
                    'bcc' => $headers['Bcc'] ?? null,
                    'thread_id' => $message['threadId'] ?? null,
                    'label_ids' => $message['labelIds'] ?? [],
                    'snippet' => $message['snippet'] ?? null,
                    'size_estimate' => $message['sizeEstimate'] ?? 0,
                ],
                'people' => $this->extractPeople($headers),
                'tags' => $this->generateTags($message, $data['labels'] ?? []),
                'categories' => $this->categorizeEmail($message, $headers),
            ];
            
            $memories[] = $memory;
        }
        
        return $memories;
    }

    private function parseHeaders(array $headers): array
    {
        $parsed = [];
        foreach ($headers as $header) {
            $parsed[$header['name']] = $header['value'];
        }
        return $parsed;
    }

    private function extractMessageBody(array $payload): string
    {
        if (isset($payload['body']['data'])) {
            return base64_decode(strtr($payload['body']['data'], '-_', '+/'));
        }
        
        if (isset($payload['parts'])) {
            foreach ($payload['parts'] as $part) {
                if ($part['mimeType'] === 'text/plain' && isset($part['body']['data'])) {
                    return base64_decode(strtr($part['body']['data'], '-_', '+/'));
                }
            }
            
            // If no plain text, try HTML
            foreach ($payload['parts'] as $part) {
                if ($part['mimeType'] === 'text/html' && isset($part['body']['data'])) {
                    $html = base64_decode(strtr($part['body']['data'], '-_', '+/'));
                    return strip_tags($html);
                }
            }
        }
        
        return '';
    }

    private function parseDate(?string $dateString): Carbon
    {
        if (!$dateString) {
            return now();
        }
        
        try {
            return Carbon::parse($dateString);
        } catch (\Exception $e) {
            return now();
        }
    }

    private function extractPeople(array $headers): array
    {
        $people = [];
        
        $fields = ['From', 'To', 'Cc', 'Bcc'];
        foreach ($fields as $field) {
            if (isset($headers[$field])) {
                $emails = $this->parseEmailAddresses($headers[$field]);
                $people = array_merge($people, $emails);
            }
        }
        
        return array_unique($people);
    }

    private function parseEmailAddresses(string $emailString): array
    {
        $emails = [];
        
        // Simple email extraction - in production, you'd want more robust parsing
        if (preg_match_all('/[\w\.-]+@[\w\.-]+\.\w+/', $emailString, $matches)) {
            $emails = $matches[0];
        }
        
        return $emails;
    }

    private function generateTags(array $message, array $labels): array
    {
        $tags = [];
        
        // Convert label IDs to label names
        $labelMap = [];
        foreach ($labels as $label) {
            $labelMap[$label['id']] = $label['name'];
        }
        
        foreach ($message['labelIds'] ?? [] as $labelId) {
            if (isset($labelMap[$labelId])) {
                $labelName = $labelMap[$labelId];
                
                // Skip system labels, add custom ones as tags
                if (!in_array($labelName, ['INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH'])) {
                    $tags[] = strtolower($labelName);
                }
            }
        }
        
        // Add some automatic tags based on content
        $snippet = strtolower($message['snippet'] ?? '');
        
        if (strpos($snippet, 'meeting') !== false) {
            $tags[] = 'meeting';
        }
        if (strpos($snippet, 'travel') !== false) {
            $tags[] = 'travel';
        }
        if (strpos($snippet, 'work') !== false) {
            $tags[] = 'work';
        }
        
        return array_unique($tags);
    }

    private function categorizeEmail(array $message, array $headers): array
    {
        $categories = [];
        
        // Categorize based on labels
        $labelIds = $message['labelIds'] ?? [];
        
        if (in_array('CATEGORY_PERSONAL', $labelIds)) {
            $categories[] = 'personal';
        }
        if (in_array('CATEGORY_SOCIAL', $labelIds)) {
            $categories[] = 'social';
        }
        if (in_array('CATEGORY_PROMOTIONS', $labelIds)) {
            $categories[] = 'promotions';
        }
        if (in_array('CATEGORY_UPDATES', $labelIds)) {
            $categories[] = 'updates';
        }
        
        // Additional categorization based on sender domain
        $from = $headers['From'] ?? '';
        if (strpos($from, '@github.com') !== false) {
            $categories[] = 'development';
        }
        if (strpos($from, '@linkedin.com') !== false) {
            $categories[] = 'professional';
        }
        
        return array_unique($categories);
    }
}
