# 🔗 Real API Setup Guide

This guide will help you connect your actual Gmail, Spotify, and other APIs to get real data into your Memory Palace.

## 🚀 Quick Setup

### 1. Google APIs (Gmail & Calendar)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable APIs**:
   - Gmail API
   - Google Calendar API
   - Google Photos Library API (optional)
4. **Create OAuth 2.0 credentials**:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://127.0.0.1:8000/auth/google/callback`
5. **Copy credentials** to your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=your_actual_client_id_here
   GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
   ```

### 2. Spotify API

1. **Go to Spotify Developer Dashboard**: https://developer.spotify.com/dashboard
2. **Create an app**:
   - App name: "Memory Palace"
   - App description: "Personal memory management"
   - Redirect URI: `http://127.0.0.1:8000/auth/spotify/callback`
3. **Copy credentials** to your `.env` file:
   ```env
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   ```

### 3. Update Environment Variables

Copy your `.env.example` to `.env` and update these values:

```env
# Gmail API
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
GOOGLE_REDIRECT_URI="http://127.0.0.1:8000/auth/google/callback"

# Spotify API  
SPOTIFY_CLIENT_ID=your_actual_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_actual_spotify_client_secret
SPOTIFY_REDIRECT_URI="http://127.0.0.1:8000/auth/spotify/callback"

# MCP Server
MCP_SERVER_HOST=127.0.0.1
MCP_SERVER_PORT=3000
```

## 🔄 Testing Your Setup

### 1. Start the Application
```bash
# Terminal 1: Laravel backend
php artisan serve

# Terminal 2: MCP Server  
npm run mcp-server

# Terminal 3: Frontend (optional)
npm run dev
```

### 2. Connect Your APIs
1. Go to http://127.0.0.1:8000/settings
2. Click "Connect" for Gmail, Calendar, or Spotify
3. Complete OAuth authorization
4. Click "Sync Now" to import your data

### 3. Test MCP Integration
The MCP server provides these tools:
- `collect_memories` - Import data from connected APIs
- `search_memories` - Search through your memories  
- `create_memory_object` - Create 3D objects in your palace

## 📊 What Data Gets Imported

### Gmail
- ✅ Recent emails (last 10)
- ✅ Subject, sender, date, content
- ✅ Sentiment analysis
- ✅ 3D email objects in Work Space

### Google Calendar
- ✅ Recent events (last 15)
- ✅ Event title, description, location, time
- ✅ 3D calendar objects in Work Space

### Spotify
- ✅ Recently played tracks (last 15)
- ✅ Track name, artist, album, play time
- ✅ 3D music objects in Personal Space

## 🛠️ Troubleshooting

### OAuth Errors
- Ensure redirect URIs match exactly in your API console
- Check that APIs are enabled in Google Cloud Console
- Verify client IDs and secrets are correct

### No Data Importing
- Check Laravel logs: `storage/logs/laravel.log`
- Verify API connections are "Active" in settings
- Test API credentials with a simple API call

### MCP Server Issues
- Ensure Node.js is installed
- Check MCP server logs for errors
- Verify Laravel API endpoints are accessible

## 🔒 Security Notes

- Never commit real API credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys and tokens
- Monitor API usage in respective dashboards

## 🎯 Next Steps

Once connected, your Memory Palace will:
1. **Automatically sync** new data every hour
2. **Create 3D objects** for each memory
3. **Organize by sentiment** and content type
4. **Enable MCP-powered** search and management

Your digital memories are now spatially organized and visually explorable! 🏰✨