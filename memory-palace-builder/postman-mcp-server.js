#!/usr/bin/env node

/**
 * Memory Palace MCP Server
 * Integrates with Postman for API management and memory collection
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Configure axios with timeout and better error handling
axios.defaults.timeout = 10000;
axios.defaults.headers.common['User-Agent'] = 'Memory-Palace-MCP-Server/1.0.0';

class MemoryPalaceMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'memory-palace-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'collect_memories',
            description: 'Collect memories from connected APIs (Gmail, Calendar, etc.)',
            inputSchema: {
              type: 'object',
              properties: {
                provider: {
                  type: 'string',
                  description: 'API provider (gmail, calendar, spotify)',
                },
                user_id: {
                  type: 'number',
                  description: 'User ID for memory collection',
                },
              },
              required: ['user_id'],
            },
          },
          {
            name: 'search_memories',
            description: 'Search through collected memories',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
                type: {
                  type: 'string',
                  description: 'Memory type filter',
                },
                sentiment: {
                  type: 'string',
                  description: 'Sentiment filter',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'create_memory_object',
            description: 'Create 3D memory object in palace',
            inputSchema: {
              type: 'object',
              properties: {
                memory_id: {
                  type: 'number',
                  description: 'Memory ID',
                },
                position: {
                  type: 'object',
                  description: '3D position {x, y, z}',
                },
                object_type: {
                  type: 'string',
                  description: 'Object type (email, photo, document)',
                },
              },
              required: ['memory_id', 'object_type'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'collect_memories':
            return await this.collectMemories(args);
          case 'search_memories':
            return await this.searchMemories(args);
          case 'create_memory_object':
            return await this.createMemoryObject(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async collectMemories(args) {
    const { provider, user_id } = args;
    
    try {
      // Get user's API connections directly from database
      const connectionsResponse = await axios.get(`http://127.0.0.1:8000/api/v1/users/${user_id}/connections`, {
        headers: { 
          'Accept': 'application/json'
        },
        timeout: 5000
      });
      
      const connections = connectionsResponse.data.data || [];
      const targetConnections = provider ? connections.filter(c => c.provider === provider) : connections;
      
      if (targetConnections.length === 0) {
        throw new Error(`No ${provider || 'API'} connections found for user`);
      }
      
      const results = [];
      let totalMemories = 0;
      
      for (const connection of targetConnections) {
        try {
          let memories = [];
          
          if (connection.provider === 'gmail') {
            memories = await this.collectGmailMemories(connection);
          } else if (connection.provider === 'calendar') {
            memories = await this.collectCalendarMemories(connection);
          } else if (connection.provider === 'spotify') {
            memories = await this.collectSpotifyMemories(connection);
          } else if (connection.provider === 'location_services') {
            memories = await this.collectLocationMemories(connection);
          }
          
          // Store memories in Laravel
          for (const memory of memories) {
            await this.storeMemory(memory, connection, user_id);
          }
          
          results.push({
            provider: connection.provider,
            status: 'success',
            memories_created: memories.length
          });
          totalMemories += memories.length;
          
        } catch (error) {
          results.push({
            provider: connection.provider,
            status: 'error',
            error: error.message
          });
        }
      }
      
      const resultText = results.map(r => 
        `${r.provider}: ${r.status === 'success' ? r.memories_created + ' memories' : 'Failed - ' + r.error}`
      ).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `Memory collection completed via MCP!\n\nResults:\n${resultText}\n\nTotal new memories: ${totalMemories}\nConnections processed: ${results.length}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to collect memories: ${error.message}`);
    }
  }
  
  async collectGmailMemories(connection) {
    let access_token = connection.access_token;
    const refresh_token = connection.refresh_token;
    
    // Check if token is expired
    const tokenExpiry = new Date(connection.token_expires_at);
    const now = new Date();
    
    if (tokenExpiry <= now) {
      // Token is expired, try to refresh
      try {
        const tokenResponse = await axios.post(`http://localhost:8000/api/v1/connections/${connection.id}/refresh-token`);
        if (tokenResponse.data.access_token) {
          access_token = tokenResponse.data.access_token;
        }
      } catch (error) {
        throw new Error('Gmail token refresh failed: ' + error.message);
      }
    }
    
    const response = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
      headers: { 'Authorization': `Bearer ${access_token}` },
      params: { maxResults: 10, q: 'in:inbox' }
    });
    
    const messages = response.data.messages || [];
    const memories = [];
    
    for (const msg of messages.slice(0, 5)) {
      const detailResponse = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      
      const email = detailResponse.data;
      const headers = email.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();
      
      let body = '';
      if (email.payload.body?.data) {
        body = Buffer.from(email.payload.body.data, 'base64').toString('utf-8');
      } else if (email.payload.parts) {
        const textPart = email.payload.parts.find(p => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      }
      
      body = body.replace(/<[^>]*>/g, '').replace(/[^\x00-\x7F]/g, '').substring(0, 500);
      
      memories.push({
        title: subject,
        content: body,
        type: 'email',
        source_data: { from, message_id: msg.id },
        memory_date: new Date(date).toISOString().split('T')[0],
        sentiment: this.analyzeSentiment(subject + ' ' + body)
      });
    }
    
    return memories;
  }
  
  async collectCalendarMemories(connection) {
    let access_token = connection.access_token;
    const refresh_token = connection.refresh_token;
    
    // Check if token is expired
    const tokenExpiry = new Date(connection.token_expires_at);
    const now = new Date();
    
    if (tokenExpiry <= now) {
      // Token is expired, try to refresh
      try {
        const tokenResponse = await axios.post(`http://localhost:8000/api/v1/connections/${connection.id}/refresh-token`);
        if (tokenResponse.data.access_token) {
          access_token = tokenResponse.data.access_token;
        }
      } catch (error) {
        throw new Error('Calendar token refresh failed: ' + error.message);
      }
    }
    
    const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      headers: { 'Authorization': `Bearer ${access_token}` },
      params: { 
        maxResults: 10,
        timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    });
    
    const events = response.data.items || [];
    const memories = [];
    
    for (const event of events) {
      memories.push({
        title: event.summary || 'Untitled Event',
        content: event.description || 'No description',
        type: 'event',
        source_data: { event_id: event.id, location: event.location },
        memory_date: event.start?.date || event.start?.dateTime?.split('T')[0] || new Date().toISOString().split('T')[0],
        sentiment: 'neutral'
      });
    }
    
    return memories;
  }
  
  async collectSpotifyMemories(connection) {
    const access_token = connection.access_token;
    const refresh_token = connection.refresh_token;
    let token = access_token;
    
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { limit: 15 }
      });
      
      const tracks = response.data.items || [];
      const memories = [];
      
      for (const item of tracks) {
        const track = item.track;
        memories.push({
          title: `${track.name} by ${track.artists[0]?.name}`,
          content: `Listened to "${track.name}" from the album "${track.album?.name}" by ${track.artists[0]?.name}. Duration: ${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}`,
          type: 'music',
          source_data: { 
            track_id: track.id, 
            artist: track.artists[0]?.name, 
            album: track.album?.name,
            spotify_url: track.external_urls?.spotify,
            duration_ms: track.duration_ms,
            played_at: item.played_at
          },
          memory_date: new Date(item.played_at).toISOString().split('T')[0],
          sentiment: 'positive'
        });
      }
      
      return memories;
    } catch (error) {
      if (error.response?.status === 401 && refresh_token) {
        // Try to refresh token
        try {
          const refreshResponse = await axios.post('https://accounts.spotify.com/api/token', {
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET
          }, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
          
          const newTokens = refreshResponse.data;
          
          // Update connection with new token
          await axios.put(`http://localhost:8000/api/v1/api-connections/${connection.id}`, {
            access_token: newTokens.access_token,
            token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
          });
          
          // Retry with new token
          return await this.collectSpotifyMemories({...connection, access_token: newTokens.access_token});
        } catch (refreshError) {
          throw new Error('Spotify token refresh failed: ' + refreshError.message);
        }
      }
      throw new Error('Spotify API error: ' + error.message);
    }
  }
  
  async collectLocationMemories(connection) {
    // Generate sample location memories for MCP integration
    const locations = [
      {
        name: 'Home',
        address: 'Your Home Address',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        visit_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        duration: 120,
        activity: 'relaxing'
      },
      {
        name: 'Coffee Shop',
        address: 'Local Coffee Shop',
        coordinates: { lat: 40.7589, lng: -73.9851 },
        visit_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        duration: 45,
        activity: 'meeting'
      },
      {
        name: 'Park',
        address: 'Central Park',
        coordinates: { lat: 40.7829, lng: -73.9654 },
        visit_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 90,
        activity: 'walking'
      }
    ];
    
    const memories = [];
    
    for (const location of locations) {
      memories.push({
        title: `Visit to ${location.name}`,
        content: `Spent ${location.duration} minutes ${location.activity} at ${location.name}`,
        type: 'location',
        source_data: {
          location_name: location.name,
          address: location.address,
          coordinates: location.coordinates,
          duration: location.duration,
          activity: location.activity
        },
        memory_date: new Date(location.visit_time).toISOString().split('T')[0],
        sentiment: 'positive'
      });
    }
    
    return memories;
  }
  
  async storeMemory(memory, connection, user_id) {
    try {
      // Ensure palace room exists
      const roomName = this.getRoomForMemoryType(memory.type);
      const room = await this.ensurePalaceRoom(user_id, roomName, memory.type);
      
      // Create memory
      const memoryResponse = await axios.post('http://localhost:8000/api/v1/memories', {
        ...memory,
        user_id,
        api_connection_id: connection.id,
        palace_room_id: room.id
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const createdMemory = memoryResponse.data;
      
      // Create 3D memory object
      await axios.post('http://localhost:8000/api/v1/memory-objects', {
        memory_id: createdMemory.id,
        palace_room_id: room.id,
        object_type: memory.type,
        title: memory.title,
        description: `${memory.type} from ${connection.provider}`,
        position: { x: Math.random() * 8 - 4, y: Math.random() * 2 + 1, z: Math.random() * 6 - 3 },
        rotation: { x: 0, y: Math.random() * 360, z: 0 },
        scale: this.getObjectScale(memory.type),
        color: this.getObjectColor(memory.sentiment),
        importance_score: 0.7,
        is_visible: true,
        is_interactive: true
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
    } catch (error) {
      console.error('Failed to store memory:', error.response?.data || error.message);
      throw error;
    }
  }
  
  getObjectScale(type) {
    switch (type) {
      case 'email':
        return { x: 1.2, y: 0.8, z: 0.1 };
      case 'event':
        return { x: 1.0, y: 1.5, z: 0.2 };
      case 'music':
        return { x: 0.8, y: 0.8, z: 0.8 };
      default:
        return { x: 1.0, y: 1.0, z: 1.0 };
    }
  }
  
  getObjectColor(sentiment) {
    switch (sentiment) {
      case 'positive':
        return { primary: '#10b981', secondary: '#ffffff' };
      case 'negative':
        return { primary: '#ef4444', secondary: '#ffffff' };
      default:
        return { primary: '#3b82f6', secondary: '#ffffff' };
    }
  }
  
  getRoomForMemoryType(type) {
    switch (type) {
      case 'email':
      case 'event':
        return 'Work Space';
      case 'music':
      case 'location':
        return 'Personal Space';
      default:
        return 'General Space';
    }
  }
  
  async ensurePalaceRoom(user_id, roomName, memoryType) {
    try {
      // Try to get existing room
      const existingResponse = await axios.get(`http://localhost:8000/api/v1/palace-rooms?user_id=${user_id}&name=${encodeURIComponent(roomName)}`);
      const existingRooms = existingResponse.data;
      
      if (existingRooms && existingRooms.length > 0) {
        return existingRooms[0];
      }
      
      // Create new room
      const roomData = {
        user_id,
        name: roomName,
        description: this.getRoomDescription(roomName),
        theme: this.getRoomTheme(memoryType),
        mood: this.getRoomMood(memoryType),
        color_scheme: this.getRoomColorScheme(memoryType),
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 10, height: 4, depth: 10 },
        lighting: { ambient: 0.4, directional: 0.8 },
        connections: [],
        is_active: true
      };
      
      const response = await axios.post('http://localhost:8000/api/v1/palace-rooms', roomData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to ensure palace room:', error.response?.data || error.message);
      // Fallback: try to find any existing room for this user
      try {
        const fallbackResponse = await axios.get(`http://localhost:8000/api/v1/palace-rooms?user_id=${user_id}`);
        const rooms = fallbackResponse.data;
        if (rooms && rooms.length > 0) {
          return rooms[0];
        }
      } catch (e) {}
      
      // Last resort: return a default structure
      return { id: 1, name: roomName };
    }
  }
  
  getRoomDescription(roomName) {
    switch (roomName) {
      case 'Work Space':
        return 'Professional memories and communications';
      case 'Personal Space':
        return 'Personal memories and entertainment';
      default:
        return 'General memories and experiences';
    }
  }
  
  getRoomTheme(memoryType) {
    switch (memoryType) {
      case 'email':
      case 'event':
        return 'professional';
      case 'music':
        return 'personal';
      default:
        return 'general';
    }
  }
  
  getRoomMood(memoryType) {
    switch (memoryType) {
      case 'email':
      case 'event':
        return 'focused';
      case 'music':
        return 'relaxed';
      default:
        return 'neutral';
    }
  }
  
  getRoomColorScheme(memoryType) {
    switch (memoryType) {
      case 'email':
      case 'event':
        return { primary: '#3b82f6', secondary: '#1e40af', accent: '#60a5fa' };
      case 'music':
        return { primary: '#10b981', secondary: '#059669', accent: '#34d399' };
      default:
        return { primary: '#6b7280', secondary: '#4b5563', accent: '#9ca3af' };
    }
  }
  
  analyzeSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy', 'excited'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'frustrated', 'disappointed'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  async searchMemories(args) {
    const { query, type, sentiment } = args;
    
    try {
      const response = await axios.post('http://localhost:8000/api/v1/memories/search', {
        q: query,
        type,
        sentiment
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const memories = response.data.data || [];
      const total = response.data.total || 0;
      
      if (memories.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No memories found matching "${query}". Try different search terms or check your API connections.`,
            },
          ],
        };
      }
      
      const memoryList = memories.slice(0, 10).map(m => {
        const date = new Date(m.memory_date).toLocaleDateString();
        const room = m.palace_room?.name || 'Unknown Room';
        return `• ${m.title} (${m.type}) - ${m.sentiment} - ${date} - ${room}`;
      }).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${total} memories matching "${query}"\n\nTop ${Math.min(10, memories.length)} results:\n${memoryList}${total > 10 ? '\n\n...and ' + (total - 10) + ' more' : ''}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to search memories: ${error.response?.data?.message || error.message}`);
    }
  }

  async createMemoryObject(args) {
    const { memory_id, position = { x: 0, y: 1, z: 0 }, object_type } = args;
    
    try {
      // Get memory details first
      const memoryResponse = await axios.get(`http://localhost:8000/api/v1/memories/${memory_id}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const memory = memoryResponse.data;
      
      // Create the 3D object
      const response = await axios.post('http://localhost:8000/api/v1/memory-objects', {
        memory_id,
        palace_room_id: memory.palace_room_id,
        object_type,
        title: memory.title,
        description: `3D ${object_type} object`,
        position,
        rotation: { x: 0, y: Math.floor(Math.random() * 360), z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: { primary: '#3b82f6', secondary: '#ffffff' },
        importance_score: 0.7,
        is_visible: true,
        is_interactive: true,
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: `Created 3D ${object_type} object "${memory.title}" at position (${position.x}, ${position.y}, ${position.z}) in ${memory.palace_room?.name || 'palace room'}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create memory object: ${error.response?.data?.message || error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Memory Palace MCP Server running on stdio');
  }
}

const server = new MemoryPalaceMCPServer();
server.run().catch(console.error);