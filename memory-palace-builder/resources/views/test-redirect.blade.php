<!DOCTYPE html>
<html>
<head>
    <title>Test Direct Spotify Redirect</title>
</head>
<body>
    <h1>Test Direct Spotify OAuth Redirect</h1>
    <button onclick="testDirectRedirect()">Test Direct Redirect</button>
    <div id="result"></div>

    <script>
        function testDirectRedirect() {
            // Test the exact OAuth URL from our debug
            const oauthUrl = 'https://accounts.spotify.com/authorize?client_id=6fcb1e0a9bff4311b705cb8d7df8a5de&response_type=code&redirect_uri=http%3A%2F%2F127.0.0.1%3A8000%2Fauth%2Fspotify%2Fcallback&scope=user-read-recently-played+user-library-read+user-top-read&state=eyJjb25uZWN0aW9uX2lkIjo5OTksInByb3ZpZGVyIjoic3BvdGlmeSJ9';
            
            console.log('Redirecting to:', oauthUrl);
            window.location.href = oauthUrl;
        }
    </script>
</body>
</html>