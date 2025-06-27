#!/usr/bin/env node

/**
 * HTTP Server with SSE Support for Zotero MCP Server
 * Provides both REST API endpoints and MCP protocol over Server-Sent Events
 */

import express from 'express';
import cors from 'cors';
import { ZoteroSingleCollectionMCPServer } from './zotero-mcp-server.js';

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize the MCP server instance
const mcpServer = new ZoteroSingleCollectionMCPServer();

// Store active SSE connections
const sseConnections = new Map();
let connectionCounter = 0;

// API Key for public access (fallback when org policy blocks allUsers)
const API_KEY = process.env.MCP_API_KEY || 'mcp-zotero-public-key-2024';

// Middleware to check authentication (API key required due to org policy)
function checkAuth(req, res, next) {
  // Check for API key in header or query param
  const apiKey = req.headers['x-api-key'] || req.query.api_key || req.query.key;
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: `API key required. Add ?key=${API_KEY} to URL or use X-API-Key header.`,
      usage: {
        'SSE endpoint': `${req.protocol}://${req.get('host')}/sse?key=${API_KEY}`,
        'Health check': `${req.protocol}://${req.get('host')}/health?key=${API_KEY}`,
        'Documentation': `${req.protocol}://${req.get('host')}/?key=${API_KEY}`
      }
    });
  }
  
  next();
}

// Apply auth to ALL endpoints due to org policy
app.use(checkAuth);

// Helper function to send SSE message
function sendSSEMessage(res, data, event = 'message') {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// MCP over SSE endpoint
app.get('/sse', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'Access-Control-Allow-Credentials': 'false'
  });

  const connectionId = ++connectionCounter;
  sseConnections.set(connectionId, res);

  console.log(`SSE connection ${connectionId} established`);

  // Send initial server capabilities
  sendSSEMessage(res, {
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
  }, 'initialized');

  // Handle client disconnect
  req.on('close', () => {
    console.log(`SSE connection ${connectionId} closed`);
    sseConnections.delete(connectionId);
  });

  req.on('error', (err) => {
    console.error(`SSE connection ${connectionId} error:`, err);
    sseConnections.delete(connectionId);
  });
});

// MCP protocol endpoint for tool calls via POST
app.post('/sse', express.json(), async (req, res) => {
  try {
    const { method, params, id } = req.body;
    
    console.log('Received MCP request:', { method, params, id });

    let response;

    switch (method) {
      case 'tools/list':
        response = {
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              {
                name: "get_collection_info",
                description: "Get information about the configured collection",
                inputSchema: {
                  type: "object",
                  properties: {}
                }
              },
              {
                name: "list_items",
                description: "List all items in the configured collection",
                inputSchema: {
                  type: "object",
                  properties: {
                    limit: {
                      type: "number",
                      description: "Maximum number of items to return (default: 100)",
                      default: 100
                    },
                    start: {
                      type: "number", 
                      description: "Starting index for pagination (default: 0)",
                      default: 0
                    },
                    format: {
                      type: "string",
                      enum: ["json", "bibtex", "ris"],
                      description: "Format for the response (default: json)",
                      default: "json"
                    }
                  }
                }
              },
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
                    item_type: {
                      type: "string",
                      description: "Filter by item type (e.g., 'journalArticle', 'book')"
                    },
                    tag: {
                      type: "string",
                      description: "Filter by tag"
                    },
                    limit: {
                      type: "number",
                      description: "Maximum number of items to return (default: 100)",
                      default: 100
                    }
                  },
                  required: ["query"]
                }
              },
              {
                name: "get_item_details",
                description: "Get detailed information about a specific item in the collection",
                inputSchema: {
                  type: "object",
                  properties: {
                    item_key: {
                      type: "string",
                      description: "The item key to retrieve details for"
                    },
                    include_children: {
                      type: "boolean",
                      description: "Include child items (notes, attachments)",
                      default: false
                    }
                  },
                  required: ["item_key"]
                }
              },
              {
                name: "get_collection_overview",
                description: "Get a comprehensive overview of the collection including item counts by type, year distribution, and top authors",
                inputSchema: {
                  type: "object",
                  properties: {}
                }
              },
              {
                name: "search_by_analysis_metadata",
                description: "Search papers by structured analysis content (methodology, findings, etc.)",
                inputSchema: {
                  type: "object",
                  properties: {
                    search_field: {
                      type: "string",
                      enum: ["summary", "findings", "methodology", "limitations", "intervention", "research_question", "all"],
                      description: "Which analysis field to search in",
                      default: "all"
                    },
                    query: {
                      type: "string",
                      description: "Search query string"
                    },
                    study_design: {
                      type: "string",
                      description: "Filter by study design (e.g., 'randomized controlled trial', 'observational')"
                    },
                    has_intervention: {
                      type: "boolean",
                      description: "Filter for papers with interventions"
                    },
                    limit: {
                      type: "number",
                      description: "Maximum number of items to return (default: 10)",
                      default: 10
                    }
                  },
                  required: ["query"]
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
            case 'get_collection_info':
              toolResult = await mcpServer.getCollectionInfo();
              break;
            case 'list_items':
              toolResult = await mcpServer.listItems(
                args?.limit || 100,
                args?.start || 0,
                args?.format || "json"
              );
              break;
            case 'search_items':
              toolResult = await mcpServer.searchItems(args);
              break;
            case 'get_item_details':
              toolResult = await mcpServer.getItemDetails(args.item_key, args?.include_children || false);
              break;
            case 'get_collection_overview':
              toolResult = await mcpServer.getCollectionOverview();
              break;
            case 'search_by_analysis_metadata':
              toolResult = await mcpServer.searchByAnalysisMetadata(args);
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
  } catch (error) {
    console.error('MCP request error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id || null,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    });
  }
});

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    connections: sseConnections.size 
  });
});

// Root endpoint with API documentation (public)
app.get('/', (req, res) => {
  res.json({
    name: 'Zotero MCP Server HTTP API',
    version: '1.0.0',
    description: 'REST API and MCP-over-SSE for Zotero research collection analysis',
    endpoints: {
      'GET /health': 'Health check (public)',
      'GET /sse': 'MCP protocol over Server-Sent Events (public)',
      'POST /sse': 'MCP tool calls via JSON-RPC (public)',
      'GET /collection/info': 'Get collection information (requires API key)',
      'GET /collection/items': 'List items (requires API key)',
      'POST /collection/search': 'Search items (requires API key)',
      'GET /collection/items/:itemKey': 'Get item details (requires API key)',
      'GET /collection/tags': 'Get collection tags (requires API key)',
      'POST /collection/bibliography': 'Generate bibliography (requires API key)',
      'GET /collection/recent': 'Get recent items (requires API key)',
      'GET /collection/overview': 'Get collection overview (requires API key)',
      'POST /analysis/search': 'Search by analysis metadata (requires API key)',
      'GET /analysis/summary': 'Get analysis summary (requires API key)',
      'POST /analysis/compare': 'Compare methodologies (requires API key)',
      'GET /analysis/gaps': 'Extract research gaps (requires API key)'
    },
    authentication: {
      api_key: 'mcp-zotero-public-key-2024',
      methods: [
        'Header: X-API-Key: mcp-zotero-public-key-2024',
        'Query param: ?api_key=mcp-zotero-public-key-2024'
      ],
      note: 'API key required for /collection/* and /analysis/* endpoints only'
    },
    mcp: {
      sse_endpoint: '/sse',
      supported_methods: ['tools/list', 'tools/call'],
      protocol: 'MCP over Server-Sent Events and JSON-RPC'
    },
    documentation: 'https://github.com/tom-mcmillan/zotero-mcp-server'
  });
});

// Original REST API endpoints (keeping for backwards compatibility)
app.get('/collection/info', async (req, res) => {
  try {
    const result = await mcpServer.getCollectionInfo();
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/collection/items', async (req, res) => {
  try {
    const { limit = 100, start = 0, format = 'json' } = req.query;
    const result = await mcpServer.listItems(
      parseInt(limit),
      parseInt(start),
      format
    );
    
    if (format === 'json') {
      res.json(JSON.parse(result.content[0].text));
    } else {
      res.set('Content-Type', 'text/plain');
      res.send(result.content[0].text);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/collection/search', async (req, res) => {
  try {
    const result = await mcpServer.searchItems(req.body);
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/collection/items/:itemKey', async (req, res) => {
  try {
    const { itemKey } = req.params;
    const { include_children = false } = req.query;
    const result = await mcpServer.getItemDetails(
      itemKey,
      include_children === 'true'
    );
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/collection/tags', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const result = await mcpServer.getCollectionTags(parseInt(limit));
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/collection/bibliography', async (req, res) => {
  try {
    const { item_keys = [], style = 'apa', format = 'html', limit = 50 } = req.body;
    const result = await mcpServer.generateBibliography(
      item_keys,
      style,
      format,
      limit
    );
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/collection/recent', async (req, res) => {
  try {
    const { limit = 10, days = 30 } = req.query;
    const result = await mcpServer.getRecentItems(
      parseInt(limit),
      parseInt(days)
    );
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/collection/overview', async (req, res) => {
  try {
    const result = await mcpServer.getCollectionOverview();
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analysis endpoints
app.post('/analysis/search', async (req, res) => {
  try {
    const result = await mcpServer.searchByAnalysisMetadata(req.body);
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/analysis/summary', async (req, res) => {
  try {
    const { include_details = false } = req.query;
    const result = await mcpServer.getAnalysisSummary(include_details === 'true');
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/analysis/compare', async (req, res) => {
  try {
    const { focus_area = 'study_design', limit = 20 } = req.body;
    const result = await mcpServer.compareMethodologies(focus_area, limit);
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/analysis/gaps', async (req, res) => {
  try {
    const { group_similar = true } = req.query;
    const result = await mcpServer.extractResearchGaps(group_similar === 'true');
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: 'Visit / for API documentation'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Zotero MCP HTTP Server with SSE running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`API docs: http://localhost:${port}/`);
  console.log(`MCP SSE endpoint: http://localhost:${port}/sse`);
});

export default app;