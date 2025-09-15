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
      // Call our Laravel API to trigger memory collection
      const response = await axios.post('http://127.0.0.1:8000/api/v1/collect-memories', {
        provider,
        user_id,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Memory collection started for ${provider || 'all providers'}. ${response.data.jobs_dispatched} jobs dispatched.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to collect memories: ${error.message}`);
    }
  }

  async searchMemories(args) {
    const { query, type, sentiment } = args;
    
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/v1/memories', {
        params: { search: query, type, sentiment },
      });

      const memories = response.data.data || [];
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${memories.length} memories matching "${query}"\n\n${memories.slice(0, 5).map(m => 
              `• ${m.title} (${m.type}) - ${m.sentiment}`
            ).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to search memories: ${error.message}`);
    }
  }

  async createMemoryObject(args) {
    const { memory_id, position = { x: 0, y: 1, z: 0 }, object_type } = args;
    
    try {
      // This would integrate with our 3D palace system
      const response = await axios.post('http://127.0.0.1:8000/api/v1/memory-objects', {
        memory_id,
        position,
        object_type,
        is_visible: true,
        is_interactive: true,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Created 3D ${object_type} object for memory ${memory_id} at position (${position.x}, ${position.y}, ${position.z})`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create memory object: ${error.message}`);
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