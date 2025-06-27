/**
 * Google Cloud Function for Zotero MCP Server
 * Provides MCP protocol over HTTP functions
 */

import { ZoteroSingleCollectionMCPServer } from './zotero-mcp-server.js';

// Initialize the MCP server instance
const mcpServer = new ZoteroSingleCollectionMCPServer();
const API_KEY = process.env.MCP_API_KEY || 'mcp-zotero-public-key-2024';

// Helper function to check API key
function checkApiKey(req) {
  const apiKey = req.headers['x-api-key'] || req.query.key || req.query.api_key;
  return apiKey === API_KEY;
}

// Main Cloud Function entry point
export async function sse(req, res) {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Check API key for authentication
  if (!checkApiKey(req)) {
    res.status(401).json({
      error: 'Unauthorized',
      message: `API key required. Add ?key=${API_KEY} to URL or use X-API-Key header.`,
      usage: {
        'SSE endpoint': `${req.protocol}://${req.get('host')}/sse?key=${API_KEY}`,
        'Test call': `curl -X POST "${req.protocol}://${req.get('host')}/sse?key=${API_KEY}" -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`
      }
    });
    return;
  }

  try {
    if (req.method === 'GET') {
      // Handle SSE connection
      res.set('Content-Type', 'text/event-stream');
      res.set('Cache-Control', 'no-cache');
      res.set('Connection', 'keep-alive');

      // Send initial capabilities
      const initMessage = {
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: {
          serverInfo: {
            name: 'Climate Index',
            version: '0.1.0',
            description: 'Research analysis for climate science papers'
          },
          capabilities: {
            tools: {
              listTools: true,
              callTool: true
            }
          }
        }
      };

      res.write(`event: initialized\n`);
      res.write(`data: ${JSON.stringify(initMessage)}\n\n`);
      res.end();
      
    } else if (req.method === 'POST') {
      // Handle MCP tool calls
      const { method, params, id } = req.body;
      
      let response;

      switch (method) {
        case 'tools/list':
          response = {
            jsonrpc: '2.0',
            id,
            result: {
              tools: [
                {
                  name: "search_items",
                  description: "Search for items within the configured collection",
                  inputSchema: {
                    type: "object",
                    properties: {
                      query: {
                        type: "string",
                        description: "Search query string"
                      },
                      limit: {
                        type: "number",
                        description: "Maximum number of items to return (default: 10)",
                        default: 10
                      }
                    },
                    required: ["query"]
                  }
                },
                {
                  name: "get_collection_info",
                  description: "Get information about the configured collection",
                  inputSchema: {
                    type: "object",
                    properties: {}
                  }
                },
                {
                  name: "get_collection_overview",
                  description: "Get a comprehensive overview of the collection",
                  inputSchema: {
                    type: "object", 
                    properties: {}
                  }
                }
              ]
            }
          };
          break;

        case 'tools/call':
          const { name, arguments: args } = params;
          let toolResult;

          try {
            switch (name) {
              case 'search_items':
                toolResult = await mcpServer.searchItems(args);
                break;
              case 'get_collection_info':
                toolResult = await mcpServer.getCollectionInfo();
                break;
              case 'get_collection_overview':
                toolResult = await mcpServer.getCollectionOverview();
                break;
              default:
                throw new Error(`Unknown tool: ${name}`);
            }

            response = {
              jsonrpc: '2.0',
              id,
              result: {
                content: toolResult.content,
                isError: false
              }
            };
          } catch (error) {
            response = {
              jsonrpc: '2.0',
              id,
              error: {
                code: -32603,
                message: `Tool execution failed: ${error.message}`
              }
            };
          }
          break;

        default:
          response = {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`
            }
          };
      }

      res.json(response);
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Function error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Health check function
export async function health(req, res) {
  res.set('Access-Control-Allow-Origin', '*');
  
  if (!checkApiKey(req)) {
    res.status(401).json({
      error: 'Unauthorized',
      message: `API key required. Add ?key=${API_KEY} to URL`
    });
    return;
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Zotero MCP Server',
    api_key_required: true
  });
}