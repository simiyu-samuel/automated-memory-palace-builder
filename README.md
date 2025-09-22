# 🏰 Memory Palace - AI-Powered 3D Memory Management

<p align="center">
  <img src="https://img.shields.io/badge/Postman-Hackathon-orange" alt="Postman Hackathon">
  <img src="https://img.shields.io/badge/Laravel-11-red" alt="Laravel 11">
  <img src="https://img.shields.io/badge/React-18-blue" alt="React 18">
  <img src="https://img.shields.io/badge/Three.js-3D-green" alt="Three.js">
  <img src="https://img.shields.io/badge/MCP-Server-purple" alt="MCP Server">
</p>

> **🤖 The world's first FULLY AUTOMATED memory palace that builds itself from your digital life**

Transform your emails, photos, and events into an interactive 3D palace where memories are spatially organized and visually explored. No manual setup required - connect your APIs and watch your palace generate automatically!

## ✨ What Makes This Special

**Unlike traditional memory palace builders that require hours of manual setup, this system:**

- 🤖 **Automatically generates 3D objects** from your real data
- 🧠 **AI-powered room assignment** based on content analysis  
- 🎨 **Dynamic visual styling** using sentiment analysis
- 🔄 **Real-time updates** as new memories are collected
- 🎮 **Interactive 3D navigation** with orbital controls
- 🔗 **Multi-API integration** (Gmail, Calendar, Spotify, Photos)

**Built for the Postman Web Dev Challenge Hackathon** - showcasing MCP servers and automated workflows.

## 🚀 Quick Start

### Prerequisites
- PHP 8.3+
- Node.js 18+
- PostgreSQL
- Composer

### Installation
```bash
# Clone and setup
git clone <repository>
cd memory-palace-builder
composer install
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database setup
php artisan migrate
php artisan db:seed --class=MemoryPalaceSeeder

# Environment setup (IMPORTANT)
# Replace placeholder values in .env with your real API credentials:
# GOOGLE_CLIENT_ID=your_actual_google_client_id
# GOOGLE_CLIENT_SECRET=your_actual_google_secret  
# SPOTIFY_CLIENT_ID=your_actual_spotify_client_id
# SPOTIFY_CLIENT_SECRET=your_actual_spotify_secret

# Build assets
npm run build

# Start servers
php artisan serve          # Laravel backend
npm run mcp-server         # MCP server
```

### Demo Access
- **URL**: https://memory-palace-app.onrender.com/
- **Login**: simiyusamuel869@gmail.com
- **Password**: password

### 🔗 Connect Your Real Data
**Want to use YOUR actual emails, photos, and music?**

See [SETUP_REAL_DATA.md](memory-palace-builder/SETUP_REAL_DATA.md) for step-by-step instructions to:
- Connect Gmail API (your real emails)
- Connect Spotify API (your music history)
- Connect Google Calendar (your events)
- Import your actual digital memories into the 3D palace

**Demo vs Real Data:**
- **Demo Mode**: Uses sample data (6 fake memories)
- **Real Data Mode**: Uses YOUR actual digital life

## 🎮 Features

### 🏰 **Automated 3D Palace**
- **Zero manual setup** - Palace builds itself from your data
- **AI room assignment** - Work/Personal/Important automatically categorized
- **Dynamic 3D objects** - Shape, color, position based on memory content
- **Interactive navigation** - Orbital camera, zoom, hover effects

### 🔗 **API Connections**
- **Gmail** - Import emails with sentiment analysis
- **Google Calendar** - Sync events and meetings
- **Google Photos** - Visual memory integration
- **Spotify** - Music listening history
- **Location Services** - Spatial context

### 🔍 **Smart Search**
- **Full-text search** across all memories
- **Advanced filters** by type, sentiment, room, date
- **Real-time results** with visual previews

### 📊 **Analytics Dashboard**
- **Memory statistics** and trends
- **Sentiment analysis** breakdown
- **Activity patterns** and insights

## 🔧 Technical Stack

- **Backend**: Laravel 11 + PostgreSQL
- **Frontend**: React 18 + Inertia.js + Tailwind CSS
- **3D Engine**: Three.js with custom automation
- **MCP Integration**: Custom server with 3 specialized tools
- **AI Processing**: Sentiment analysis and content categorization

## 🏆 Postman Integration

### MCP Server Tools
- `collect_memories` - Automated data collection from APIs
- `search_memories` - Intelligent memory search
- `create_memory_object` - Dynamic 3D object generation

### API Endpoints
```
POST /api/v1/collect-memories    # Trigger memory collection
GET  /api/v1/memories           # Search and filter memories  
POST /api/v1/memory-objects     # Create 3D representations
POST /api/v1/connections        # Manage API connections
```

## 🎯 Competitive Advantage

**Traditional Memory Palace Apps:**
- ❌ Manual room creation
- ❌ Static object placement
- ❌ No real data integration
- ❌ Hours of setup time

**Our AI-Powered Solution:**
- ✅ **Fully automated** palace generation
- ✅ **Real data integration** from multiple APIs
- ✅ **AI-driven organization** and visualization
- ✅ **Instant results** - working palace in seconds

## 📝 Documentation

See [POSTMAN_NOTEBOOK.md](POSTMAN_NOTEBOOK.md) for complete hackathon submission details.

## 🏆 Hackathon Submission

**Built for**: Postman Web Dev Challenge Hackathon  
**Theme**: Build an MCP-powered app made just for you  
**Personal Value**: Solving digital memory overload through spatial visualization

---

*Making personal memory management spatial, visual, and delightful* 🏰✨
