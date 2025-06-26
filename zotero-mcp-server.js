#!/usr/bin/env node

/**
 * Zotero MCP Server
 * A Model Context Protocol server for interacting with Zotero collections
 * Uses the Zotero Web API: https://www.zotero.org/support/dev/web_api/v3/start
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from 'node-fetch';

class ZoteroMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "zotero-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiKey = process.env.ZOTERO_API_KEY;
    this.userId = process.env.ZOTERO_USER_ID;
    this.baseUrl = 'https://api.zotero.org';
    
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "list_collections",
            description: "List all collections in the Zotero library",
            inputSchema: {
              type: "object",
              properties: {
                limit: {
                  type: "number",
                  description: "Maximum number of collections to return (default: 50)",
                  default: 50
                }
              }
            },
          },
          {
            name: "get_collection_items",
            description: "Get items from a specific collection",
            inputSchema: {
              type: "object",
              properties: {
                collection_key: {
                  type: "string",
                  description: "The collection key to retrieve items from",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of items to return (default: 25)",
                  default: 25
                },
                format: {
                  type: "string",
                  enum: ["json", "bibtex", "ris"],
                  description: "Format for the response (default: json)",
                  default: "json"
                }
              },
              required: ["collection_key"],
            },
          },
          {
            name: "search_items",
            description: "Search for items in the library",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query string",
                },
                item_type: {
                  type: "string",
                  description: "Filter by item type (e.g., 'journalArticle', 'book')",
                },
                tag: {
                  type: "string",
                  description: "Filter by tag",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of items to return (default: 25)",
                  default: 25
                }
              },
              required: ["query"],
            },
          },
          {
            name: "get_item_details",
            description: "Get detailed information about a specific item",
            inputSchema: {
              type: "object",
              properties: {
                item_key: {
                  type: "string",
                  description: "The item key to retrieve details for",
                },
                include_children: {
                  type: "boolean",
                  description: "Include child items (notes, attachments)",
                  default: false
                }
              },
              required: ["item_key"],
            },
          },
          {
            name: "get_item_tags",
            description: "Get all tags used in the library",
            inputSchema: {
              type: "object",
              properties: {
                limit: {
                  type: "number",
                  description: "Maximum number of tags to return (default: 100)",
                  default: 100
                }
              }
            },
          },
          {
            name: "generate_bibliography",
            description: "Generate a bibliography for specific items",
            inputSchema: {
              type: "object",
              properties: {
                item_keys: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of item keys to include in bibliography",
                },
                style: {
                  type: "string",
                  description: "Citation style (e.g., 'apa', 'chicago-note-bibliography', 'mla')",
                  default: "apa"
                },
                format: {
                  type: "string",
                  enum: ["html", "text"],
                  description: "Output format",
                  default: "html"
                }
              },
              required: ["item_keys"],
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
          case "list_collections":
            return await this.listCollections(args?.limit || 50);
          
          case "get_collection_items":
            return await this.getCollectionItems(
              args.collection_key, 
              args?.limit || 25,
              args?.format || "json"
            );
          
          case "search_items":
            return await this.searchItems(args);
          
          case "get_item_details":
            return await this.getItemDetails(args.item_key, args?.include_children || false);
          
          case "get_item_tags":
            return await this.getItemTags(args?.limit || 100);
          
          case "generate_bibliography":
            return await this.generateBibliography(
              args.item_keys, 
              args?.style || "apa",
              args?.format || "html"
            );
          
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
    });
  }

  async makeZoteroRequest(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}/users/${this.userId}${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value);
      }
    });

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'User-Agent': 'Zotero-MCP-Server/0.1.0'
    };

    const response = await fetch(url.toString(), { headers });
    
    if (!response.ok) {
      throw new Error(`Zotero API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async listCollections(limit = 50) {
    const collections = await this.makeZoteroRequest('/collections', { limit });
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            total_collections: collections.length,
            collections: collections.map(col => ({
              key: col.key,
              name: col.data.name,
              parent: col.data.parentCollection || null,
              item_count: col.meta.numItems || 0
            }))
          }, null, 2)
        }
      ]
    };
  }

  async getCollectionItems(collectionKey, limit = 25, format = "json") {
    const items = await this.makeZoteroRequest(`/collections/${collectionKey}/items`, { 
      limit,
      format: format === "json" ? undefined : format
    });

    if (format !== "json") {
      return {
        content: [
          {
            type: "text",
            text: items
          }
        ]
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            collection_key: collectionKey,
            total_items: items.length,
            items: items.map(item => ({
              key: item.key,
              title: item.data.title,
              item_type: item.data.itemType,
              creators: item.data.creators || [],
              date: item.data.date,
              url: item.data.url,
              tags: item.data.tags || []
            }))
          }, null, 2)
        }
      ]
    };
  }

  async searchItems(args) {
    const params = {
      q: args.query,
      limit: args.limit || 25
    };

    if (args.item_type) params.itemType = args.item_type;
    if (args.tag) params.tag = args.tag;

    const items = await this.makeZoteroRequest('/items', params);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            query: args.query,
            total_results: items.length,
            items: items.map(item => ({
              key: item.key,
              title: item.data.title,
              item_type: item.data.itemType,
              creators: item.data.creators || [],
              date: item.data.date,
              abstract: item.data.abstractNote,
              tags: item.data.tags || []
            }))
          }, null, 2)
        }
      ]
    };
  }

  async getItemDetails(itemKey, includeChildren = false) {
    const item = await this.makeZoteroRequest(`/items/${itemKey}`);
    
    let children = [];
    if (includeChildren) {
      children = await this.makeZoteroRequest(`/items/${itemKey}/children`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            key: item.key,
            item_type: item.data.itemType,
            title: item.data.title,
            creators: item.data.creators || [],
            abstract: item.data.abstractNote,
            date: item.data.date,
            publication: item.data.publicationTitle,
            volume: item.data.volume,
            issue: item.data.issue,
            pages: item.data.pages,
            doi: item.data.DOI,
            url: item.data.url,
            tags: item.data.tags || [],
            collections: item.data.collections || [],
            children: children.map(child => ({
              key: child.key,
              type: child.data.itemType,
              title: child.data.title,
              note: child.data.note
            }))
          }, null, 2)
        }
      ]
    };
  }

  async getItemTags(limit = 100) {
    const tags = await this.makeZoteroRequest('/tags', { limit });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            total_tags: tags.length,
            tags: tags.map(tag => ({
              name: tag.tag,
              num_items: tag.meta.numItems || 0
            }))
          }, null, 2)
        }
      ]
    };
  }

  async generateBibliography(itemKeys, style = "apa", format = "html") {
    // Note: This is a simplified version. The actual Zotero API supports
    // bibliography generation, but requires more complex setup
    const items = await Promise.all(
      itemKeys.map(key => this.makeZoteroRequest(`/items/${key}`))
    );

    const bibliography = items.map(item => {
      const data = item.data;
      const authors = data.creators?.map(c => c.lastName + ", " + c.firstName).join("; ") || "";
      const year = data.date ? new Date(data.date).getFullYear() : "";
      
      // Simple APA-style format
      return `${authors} (${year}). ${data.title}. ${data.publicationTitle || ""}`;
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            style: style,
            format: format,
            bibliography: bibliography
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Zotero MCP server running on stdio");
  }
}

// Configuration check
if (!process.env.ZOTERO_API_KEY || !process.env.ZOTERO_USER_ID) {
  console.error("Error: ZOTERO_API_KEY and ZOTERO_USER_ID environment variables are required");
  console.error("Get your API key from: https://www.zotero.org/settings/keys");
  process.exit(1);
}

const server = new ZoteroMCPServer();
server.run().catch(console.error);
