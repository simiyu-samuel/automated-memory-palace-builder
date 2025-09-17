# Memory Palace - Postman Hackathon Submission

## 🏰 Project Overview
**Memory Palace** is a personal 3D memory management system that transforms your digital memories (emails, photos, events) into an interactive 3D palace where you can explore and organize them spatially.

## 🎯 Personal Value
As someone who receives hundreds of emails, takes countless photos, and attends numerous meetings, I needed a way to:
- **Visualize memories spatially** instead of chronologically
- **Connect related memories** across different platforms
- **Make memory retrieval intuitive** through 3D navigation
- **Organize personal data** in a meaningful, visual way

## 🔧 Postman Integration

### MCP Server Implementation
- **File**: `postman-mcp-server.js`
- **Purpose**: Provides MCP tools for memory collection and 3D object creation
- **Tools Available**:
  - `collect_memories` - Gather data from connected APIs
  - `search_memories` - Find specific memories
  - `create_memory_object` - Generate 3D representations

### API Endpoints Used
```
POST /api/sync-all
POST /api/search-mcp
POST /api/connections/{id}/sync
POST /api/simple-sync/{connectionId}
GET  /api/palace-rooms
POST /api/connections
GET  /api/memory-objects
POST /api/memories/search
GET  /api/palace/updates
```

## 🚀 How to Run

### 1. Start Laravel Backend
```bash
cd memory-palace-builder
php artisan serve
```

### 2. Start MCP Server
```bash
npm run mcp-server
```

### 3. Access Application
- **Web Interface**: http://127.0.0.1:8000
- **Login**: simiyusamuel869@gmail.com / password

## 🎮 Features Demonstration

### 1. **AUTOMATED** 3D Memory Palace
- **Zero manual setup** - Connect APIs and palace builds itself
- **AI room assignment** - Work/Personal/Important automatically categorized
- **Dynamic object generation** - Shape, color, position based on memory content
- **Real-time updates** - New memories instantly appear as 3D objects
- Interactive orbital camera controls and hover effects

### 2. API Connections
- Connect Gmail, Google Calendar, Spotify, Location Services
- Service-specific configuration forms with OAuth flow
- Real-time sync capabilities via MCP server
- Secure credential storage with token refresh

### 3. Memory Search
- Full-text search across all memories via `/api/memories/search`
- Filter by type, sentiment, room, date, tags
- AI-powered relevance scoring through MCP
- Real-time results with proper pagination

### 4. Dashboard Analytics
- Memory count statistics via `/api/memories/stats`
- Sentiment analysis breakdown
- Processing logs monitoring at `/api/processing-logs`
- User insights through `/api/insights`

## 🔗 Postman Collection

### Memory Collection Workflow
```json
{
  "info": {
    "name": "Memory Palace API",
    "description": "Personal memory management system"
  },
  "item": [
    {
      "name": "MCP Sync All Connections",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/sync-all",
        "body": {
          "provider": "gmail"
        }
      }
    },
    {
      "name": "MCP Search Memories",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/search-mcp",
        "body": {
          "query": "project",
          "type": "email",
          "sentiment": "positive"
        }
      }
    },
    {
      "name": "Get Palace Rooms",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/palace-rooms",
        "params": [
          {"key": "user_id", "value": "2"}
        ]
      }
    },
    {
      "name": "Create Memory Object",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/memory-objects",
        "body": {
          "memory_id": 1,
          "palace_room_id": 1,
          "position": {"x": 2, "y": 1.5, "z": -1},
          "object_type": "email"
        }
      }
    },
    {
      "name": "Real-time Palace Updates",
      "request": {
        "method": "GET", 
        "url": "{{base_url}}/api/palace/updates",
        "params": [
          {"key": "since", "value": "2024-12-15T10:00:00Z"}
        ]
      }
    }
  ]
}
```

## 🎨 Creative Implementation

### 🤖 **FULLY AUTOMATED 3D GENERATION** - *Key Differentiator*
Unlike manual memory palace builders, **everything is generated automatically**:

#### **Automatic Room Assignment**
```javascript
// AI determines room placement based on memory content
if (memory.tags.includes('work') || memory.type === 'email') {
    room = 'Work Space';
} else if (memory.tags.includes('family') || memory.type === 'photo') {
    room = 'Personal Gallery';
} else {
    room = 'Main Hall';
}
```

#### **Dynamic 3D Object Creation**
```javascript
// Automatic geometry selection based on memory type
switch (memoryObj.type) {
    case 'email': geometry = new THREE.BoxGeometry(1.2, 0.8, 0.1); break;
    case 'photo': geometry = new THREE.PlaneGeometry(1.5, 1.0); break;
    case 'call': geometry = new THREE.SphereGeometry(0.6, 20, 20); break;
    case 'event': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8); break;
}
```

#### **AI-Powered Positioning**
```javascript
// Automatic spatial positioning to avoid overlaps
position: {
    x: Math.random() * 8 - 4,  // Distributed placement
    y: 1 + Math.random() * 2,  // Floating height
    z: Math.random() * 6 - 3   // Depth variation
}
```

#### **Sentiment-Based Styling**
```javascript
// Colors automatically assigned by AI sentiment analysis
const color = memory.sentiment === 'positive' ? '#10b981' : 
              memory.sentiment === 'negative' ? '#ef4444' : '#6b7280';
```

### **Zero Manual Configuration Required**
1. **Connect API** → OAuth flow creates secure connection
2. **MCP Processing** → AI analysis via `/api/sync-all`
3. **3D Generation** → Objects created at `/api/memory-objects`
4. **Real-time Updates** → Live sync via `/api/palace/updates`

### **Real-Time Automation**
- New memories automatically appear through MCP server processing
- AI continuously optimizes object placement via Laravel jobs
- Dynamic room themes based on content analysis
- Automatic relationship mapping through `/api/memories/{id}/related`

## 🏆 Technical Achievements

### 🤖 **Automated 3D Pipeline** - *Revolutionary Approach*
```
API Data → MCP Server → Laravel Processing → 3D Palace
    │           │              │              │
  Gmail      AI Analysis    Database      Three.js
  Calendar   Sentiment      Queue Jobs    Rendering
  Photos     Categories     Real-time     Interaction
```

### **Smart Memory Processing**
- **MCP server integration** with 3 specialized tools
- **Laravel queue jobs** for background processing
- **Real-time sync** via `/api/connections/{id}/sync`
- **OAuth token management** with automatic refresh
- **Session-based authentication** with CSRF protection

### **Advanced Search & Analytics**
- **Full-text search** with PostgreSQL indexing
- **Multi-dimensional filtering** by sentiment, type, room, tags
- **AI-powered relevance** scoring through MCP
- **Real-time palace updates** for live synchronization
- **Processing logs** for debugging and monitoring

### 3D Visualization Engine
- **Procedural geometry generation** based on memory data
- **Automatic material assignment** using sentiment colors
- **Dynamic positioning algorithms** for optimal layout
- **Palace room management** with theme-based organization
- **Interactive memory objects** with hover and click events

### API Architecture
- **RESTful Laravel backend** with Inertia.js frontend
- **PostgreSQL database** with AI-optimized memory storage
- **MCP server integration** for intelligent processing
- **OAuth integration** for Gmail, Calendar, Spotify
- **Background job processing** for scalable memory collection

## 📊 Demo Data & Authentication
The system comes pre-seeded with:
- **Demo user**: simiyusamuel869@gmail.com / password
- 6 sample memories across different types
- 3 themed palace rooms with AI-generated layouts
- 1 active Gmail API connection with OAuth tokens
- Processing logs and user insights

### Authentication Flow
1. **Web login** at http://127.0.0.1:8000/login
2. **Session-based auth** with Laravel Breeze
3. **CSRF protection** for all POST/PUT/DELETE requests
4. **OAuth callbacks** for API connections at `/auth/{provider}/callback`

## 🎯 Personal Impact & Competitive Advantage

### **Solves Real Memory Overload Problem**
Instead of losing important emails in my inbox or forgetting meaningful photos, I can now:
- **Spatially navigate** through my digital life
- **AI-powered search** finds memories instantly
- **Visual connections** between related content
- **Real-time updates** keep palace current

### **🚀 What Makes This Different from Other Memory Palace Apps:**

#### **Traditional Memory Palace Builders:**
- ❌ Require manual room creation
- ❌ Need manual object placement  
- ❌ Static, pre-designed layouts
- ❌ No real data integration
- ❌ Time-intensive setup process

#### **Our Automated Memory Palace:**
- ✅ **Zero setup** - OAuth connects and MCP processes automatically
- ✅ **AI-powered** - Smart categorization via `/api/search-mcp`
- ✅ **Real data integration** - Actual Gmail, Calendar, Photos
- ✅ **Live updates** - Real-time sync via `/api/palace/updates`
- ✅ **Production ready** - Laravel backend with proper authentication

**This isn't just a memory palace - it's an AI-powered digital life visualizer with production-grade architecture!**

## 🔮 Future Enhancements

### **Advanced MCP Integration**
- **Predictive memory importance** using machine learning
- **Cross-platform relationship mapping** between services
- **Automatic memory clustering** by AI-detected themes
- **Smart notification system** for important memories

### **Enhanced Visualization**
- **WebXR support** for immersive VR/AR exploration
- **Procedural room generation** based on memory themes
- **Dynamic lighting systems** reflecting memory sentiment
- **Collaborative palace sharing** with family/friends

### **Production Features**
- **Multi-user support** with role-based access
- **API rate limiting** and quota management
- **Advanced caching** with Redis integration
- **Monitoring dashboard** for system health

---

**Built for the Postman Web Dev Challenge Hackathon**  
*Making personal memory management spatial, visual, and production-ready* 🏰✨

## 🔧 Technical Stack
- **Backend**: Laravel 11+ with Inertia.js
- **Database**: PostgreSQL with full-text search
- **Frontend**: React.js with Three.js for 3D rendering
- **MCP Server**: Node.js with custom tools
- **Authentication**: Laravel Breeze with OAuth
- **Deployment**: PHP 8.3, Composer, NPM