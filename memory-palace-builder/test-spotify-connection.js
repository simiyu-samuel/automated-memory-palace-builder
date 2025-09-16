// Test Spotify connection creation directly
const testData = {
    provider: 'spotify',
    email: 'test@spotify.com',
    account_name: 'Test Spotify Account',
    scopes: ['user-read-recently-played', 'user-library-read']
};

fetch('http://127.0.0.1:8000/api/v1/connections', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': 'test-token'
    },
    body: JSON.stringify(testData)
})
.then(response => {
    console.log('Status:', response.status);
    return response.json();
})
.then(data => {
    console.log('Response:', data);
    if (data.oauth_url) {
        console.log('OAuth URL:', data.oauth_url);
    }
})
.catch(error => {
    console.error('Error:', error);
});