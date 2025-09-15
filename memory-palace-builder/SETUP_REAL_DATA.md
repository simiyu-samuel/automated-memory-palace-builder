# 🔗 Setting Up Real Data Connections

## 📧 Gmail Integration (Your Real Emails)

### 1. Get Google API Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable **Gmail API** and **Google Calendar API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Set **Authorized redirect URIs**: `http://127.0.0.1:8000/auth/google/callback`
6. Copy **Client ID** and **Client Secret**

### 2. Update .env File
```bash
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

### 3. Connect in App
1. Login to Memory Palace
2. Go to **Settings** → **API Connections**
3. Click **Connect** on Gmail
4. Enter your Google credentials
5. Authorize access to your Gmail

## 🎵 Spotify Integration (Your Music History)

### 1. Get Spotify API Credentials
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create new app
3. Set **Redirect URI**: `http://127.0.0.1:8000/auth/spotify/callback`
4. Copy **Client ID** and **Client Secret**

### 2. Update .env File
```bash
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

### 3. Connect in App
1. Go to **Settings** → **API Connections**
2. Click **Connect** on Spotify
3. Enter your Spotify app credentials
4. Authorize access to your listening history

## 🔧 Postman MCP Server Setup

### 1. Install MCP Dependencies
```bash
npm install @modelcontextprotocol/sdk
```

### 2. Start MCP Server
```bash
npm run mcp-server
```

### 3. Test MCP Tools
```bash
# Test memory collection
curl -X POST http://127.0.0.1:8000/api/v1/collect-memories \
  -H "Content-Type: application/json" \
  -d '{"provider": "gmail", "user_id": 2}'

# Test memory search
curl "http://127.0.0.1:8000/api/v1/memories?search=project&type=email"
```

## 📱 Using Your Real Data

### Step 1: Connect APIs
1. **Login**: `simiyusamuel869@gmail.com` / `password`
2. **Go to Settings**: Click Settings in navigation
3. **Connect Services**: Click "Connect" on Gmail, Spotify, etc.
4. **Enter Real Credentials**: Use your actual API keys

### Step 2: Import Your Data
1. **Automatic Import**: Once connected, data imports automatically
2. **Manual Trigger**: Use "Sync Now" button for immediate import
3. **View Progress**: Check dashboard for import status

### Step 3: Explore Your 3D Palace
1. **Go to Palace**: Click "3D Palace" tab
2. **See Your Memories**: Real emails, photos, events as 3D objects
3. **Navigate**: Drag to orbit, scroll to zoom
4. **Interact**: Click objects to see your actual data

## 🎯 What Data Gets Imported

### Gmail
- **Recent emails** (last 50)
- **Subject lines** and content snippets
- **Sender information**
- **Sentiment analysis** of email content
- **Automatic categorization** (work/personal)

### Spotify
- **Recently played tracks**
- **Listening history**
- **Favorite artists** and songs
- **Music mood analysis**

### Google Calendar
- **Upcoming events**
- **Meeting details**
- **Event locations** and attendees
- **Event importance scoring**

## 🔒 Privacy & Security

- **Local Storage**: All data stored in your local database
- **Encrypted Credentials**: API keys encrypted in database
- **No Data Sharing**: Your data never leaves your system
- **Revoke Access**: Disconnect APIs anytime in Settings

## 🚨 Demo Mode vs Real Data

### Demo Mode (Default)
- Uses **sample data** for demonstration
- **6 fake memories** pre-loaded
- **No real API connections** needed
- **Perfect for testing** the 3D palace

### Real Data Mode
- **Connect your actual APIs** using steps above
- **Import your real memories** from Gmail, Spotify, etc.
- **See your actual digital life** in 3D
- **Fully personalized experience**

## 🛠️ Troubleshooting

### "Connection Failed"
- Check API credentials in .env file
- Verify redirect URIs match exactly
- Ensure APIs are enabled in respective consoles

### "No Data Imported"
- Check API connection status in Settings
- Try manual sync with "Sync Now" button
- Verify API permissions granted during OAuth

### "MCP Server Not Running"
- Run `npm run mcp-server` in separate terminal
- Check port 3000 is not in use
- Verify MCP dependencies installed

---

**Ready to see your real digital life in 3D?** Follow the steps above to connect your actual data! 🚀