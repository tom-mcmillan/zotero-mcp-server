#!/usr/bin/env node

/**
 * Zotero MCP Server - Single Collection Version
 * A Model Context Protocol server for interacting with a specific Zotero collection
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

class ZoteroSingleCollectionMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "zotero-single-collection-mcp-server",
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
    this.collectionKey = process.env.ZOTERO_COLLECTION_KEY;
    this.baseUrl = 'https://api.zotero.org';
    
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_collection_info",
            description: "Get information about the configured collection",
            inputSchema: {
              type: "object",
              properties: {}
            },
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
            },
          },
          {
            name: "search_items",
            description: "Search for items within the configured collection",
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
                  description: "Maximum number of items to return (default: 100)",
                  default: 100
                }
              },
              required: ["query"],
            },
          },
          {
            name: "get_item_details",
            description: "Get detailed information about a specific item in the collection",
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
            name: "get_collection_tags",
            description: "Get all tags used in the configured collection",
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
            description: "Generate a bibliography for specific items in the collection",
            inputSchema: {
              type: "object",
              properties: {
                item_keys: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of item keys to include in bibliography. If empty, uses all items in collection.",
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
                },
                limit: {
                  type: "number",
                  description: "Maximum number of items to include if no specific keys provided (default: 50)",
                  default: 50
                }
              }
            },
          },
          {
            name: "get_recent_items",
            description: "Get recently added items from the collection",
            inputSchema: {
              type: "object",
              properties: {
                limit: {
                  type: "number",
                  description: "Maximum number of recent items to return (default: 10)",
                  default: 10
                },
                days: {
                  type: "number",
                  description: "Number of days back to look for recent items (default: 30)",
                  default: 30
                }
              }
            },
          },
          {
            name: "get_collection_overview",
            description: "Get a comprehensive overview of the collection including item counts by type, year distribution, and top authors",
            inputSchema: {
              type: "object",
              properties: {}
            },
          },
          {
            name: "search_by_elicit_metadata",
            description: "Search papers specifically by Elicit analysis content (methodology, findings, etc.)",
            inputSchema: {
              type: "object",
              properties: {
                search_field: {
                  type: "string",
                  enum: ["summary", "findings", "methodology", "limitations", "intervention", "research_question", "all"],
                  description: "Which Elicit field to search in",
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
          },
          {
            name: "get_elicit_summary",
            description: "Get a summary of Elicit analysis coverage across the collection",
            inputSchema: {
              type: "object",
              properties: {
                include_details: {
                  type: "boolean",
                  description: "Include detailed breakdown of analysis fields",
                  default: false
                }
              }
            }
          },
          {
            name: "compare_methodologies",
            description: "Compare methodologies across papers with Elicit analysis",
            inputSchema: {
              type: "object",
              properties: {
                focus_area: {
                  type: "string",
                  enum: ["study_design", "statistical_techniques", "interventions", "outcomes"],
                  description: "What aspect of methodology to compare",
                  default: "study_design"
                },
                limit: {
                  type: "number",
                  description: "Maximum number of papers to include",
                  default: 20
                }
              }
            }
          },
          {
            name: "extract_research_gaps",
            description: "Extract and synthesize research gaps identified across papers",
            inputSchema: {
              type: "object",
              properties: {
                group_similar: {
                  type: "boolean",
                  description: "Attempt to group similar research gaps",
                  default: true
                }
              }
            }
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_collection_info":
            return await this.getCollectionInfo();
          
          case "list_items":
            return await this.listItems(
              args?.limit || 100,
              args?.start || 0,
              args?.format || "json"
            );
          
          case "search_items":
            return await this.searchItems(args);
          
          case "get_item_details":
            return await this.getItemDetails(args.item_key, args?.include_children || false);
          
          case "get_collection_tags":
            return await this.getCollectionTags(args?.limit || 100);
          
          case "generate_bibliography":
            return await this.generateBibliography(
              args?.item_keys || [],
              args?.style || "apa",
              args?.format || "html",
              args?.limit || 50
            );
          
          case "get_recent_items":
            return await this.getRecentItems(args?.limit || 10, args?.days || 30);
          
          case "get_collection_overview":
            return await this.getCollectionOverview();
          
          case "search_by_elicit_metadata":
            return await this.searchByElicitMetadata(args);
          
          case "get_elicit_summary":
            return await this.getElicitSummary(args?.include_details || false);
          
          case "compare_methodologies":
            return await this.compareMethodologies(args?.focus_area || "study_design", args?.limit || 20);
          
          case "extract_research_gaps":
            return await this.extractResearchGaps(args?.group_similar !== false);
          
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
      'User-Agent': 'Zotero-Single-Collection-MCP-Server/0.1.0'
    };

    const response = await fetch(url.toString(), { headers });
    
    if (!response.ok) {
      throw new Error(`Zotero API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getCollectionInfo() {
    const collection = await this.makeZoteroRequest(`/collections/${this.collectionKey}`);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            key: collection.key,
            name: collection.data.name,
            description: collection.data.description || "No description",
            parent: collection.data.parentCollection || null,
            item_count: collection.meta.numItems || 0,
            created: collection.data.dateAdded,
            modified: collection.data.dateModified
          }, null, 2)
        }
      ]
    };
  }

  async listItems(limit = 100, start = 0, format = "json") {
    const items = await this.makeZoteroRequest(`/collections/${this.collectionKey}/items`, { 
      limit,
      start,
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
            collection_key: this.collectionKey,
            total_items: items.length,
            start_index: start,
            items: items.map(item => ({
              key: item.key,
              title: item.data.title,
              item_type: item.data.itemType,
              creators: item.data.creators || [],
              date: item.data.date,
              url: item.data.url,
              tags: item.data.tags || [],
              date_added: item.data.dateAdded,
              date_modified: item.data.dateModified
            }))
          }, null, 2)
        }
      ]
    };
  }

  async searchItems(args) {
    const params = {
      q: args.query,
      limit: args.limit || 100
    };

    if (args.item_type) params.itemType = args.item_type;
    if (args.tag) params.tag = args.tag;

    // Search within the specific collection
    const items = await this.makeZoteroRequest(`/collections/${this.collectionKey}/items`, params);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            collection_key: this.collectionKey,
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
    // First verify the item is in our collection
    const collectionItems = await this.makeZoteroRequest(`/collections/${this.collectionKey}/items`);
    const itemInCollection = collectionItems.find(item => item.key === itemKey);
    
    if (!itemInCollection) {
      throw new Error(`Item ${itemKey} not found in the configured collection`);
    }

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
            date_added: item.data.dateAdded,
            date_modified: item.data.dateModified,
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

  async getCollectionTags(limit = 100) {
    // Get tags specifically from the collection
    const items = await this.makeZoteroRequest(`/collections/${this.collectionKey}/items`);
    const tagMap = new Map();
    
    items.forEach(item => {
      if (item.data.tags) {
        item.data.tags.forEach(tagObj => {
          const tagName = tagObj.tag || tagObj;
          tagMap.set(tagName, (tagMap.get(tagName) || 0) + 1);
        });
      }
    });

    const sortedTags = Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, num_items: count }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            collection_key: this.collectionKey,
            total_tags: sortedTags.length,
            tags: sortedTags
          }, null, 2)
        }
      ]
    };
  }

  async generateBibliography(itemKeys = [], style = "apa", format = "html", limit = 50) {
    let items;
    
    if (itemKeys.length === 0) {
      // Get all items from the collection if no specific keys provided
      items = await this.makeZoteroRequest(`/collections/${this.collectionKey}/items`, { limit });
    } else {
      // Get specific items and verify they're in the collection
      const collectionItems = await this.makeZoteroRequest(`/collections/${this.collectionKey}/items`);
      const collectionKeys = new Set(collectionItems.map(item => item.key));
      
      const validKeys = itemKeys.filter(key => collectionKeys.has(key));
      if (validKeys.length === 0) {
        throw new Error("None of the specified items are in the configured collection");
      }
      
      items = await Promise.all(
        validKeys.map(key => this.makeZoteroRequest(`/items/${key}`))
      );
    }

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
            collection_key: this.collectionKey,
            style: style,
            format: format,
            total_items: bibliography.length,
            bibliography: bibliography
          }, null, 2)
        }
      ]
    };
  }

  async getRecentItems(limit = 10, days = 30) {
    const items = await this.makeZoteroRequest(`/collections/${this.collectionKey}/items`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentItems = items
      .filter(item => {
        const dateAdded = new Date(item.data.dateAdded);
        return dateAdded >= cutoffDate;
      })
      .sort((a, b) => new Date(b.data.dateAdded) - new Date(a.data.dateAdded))
      .slice(0, limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            collection_key: this.collectionKey,
            days_back: days,
            total_recent: recentItems.length,
            items: recentItems.map(item => ({
              key: item.key,
              title: item.data.title,
              item_type: item.data.itemType,
              creators: item.data.creators || [],
              date_added: item.data.dateAdded,
              tags: item.data.tags || []
            }))
          }, null, 2)
        }
      ]
    };
  }

  // Utility method to clean HTML for display
  cleanHTMLForDisplay(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<br>/g, ' ')
      .trim();
  }

  async searchByElicitMetadata(args) {
    const items = await this.makeZoteroRequest(`/collections/${this.collectionKey}/items`, { limit: 100 });
    const results = [];
    
    for (const item of items) {
      const children = await this.makeZoteroRequest(`/items/${item.key}/children`);
      
      // Find Elicit analysis note
      const elicitNote = children.find(child => 
        child.data.itemType === 'note' && 
        (child.data.note?.includes('Elicit Analysis') || 
         child.data.note?.includes('elicit-analysis'))
      );
      
      if (!elicitNote) continue;
      
      const noteContent = elicitNote.data.note.toLowerCase();
      const queryLower = args.query.toLowerCase();
      
      // Search in specific field or all fields
      let matchFound = false;
      let matchContext = '';
      
      if (args.search_field === 'all' || !args.search_field) {
        matchFound = noteContent.includes(queryLower);
        if (matchFound) {
          // Extract context around the match
          const index = noteContent.indexOf(queryLower);
          const start = Math.max(0, index - 100);
          const end = Math.min(noteContent.length, index + 200);
          matchContext = noteContent.substring(start, end);
        }
      } else {
        // Search in specific sections
        const fieldPatterns = {
          'summary': /summary.*?(?=<\/div>|<h[23])/gi,
          'findings': /main findings.*?(?=<\/div>|<h[23])/gi,
          'methodology': /methodology.*?(?=<\/div>|<h[23])/gi,
          'limitations': /limitations.*?(?=<\/div>|<h[23])/gi,
          'intervention': /intervention.*?(?=<\/div>|<h[23])/gi,
          'research_question': /research question.*?(?=<\/div>|<h[23])/gi
        };
        
        const pattern = fieldPatterns[args.search_field];
        if (pattern) {
          const matches = noteContent.match(pattern);
          if (matches) {
            matchFound = matches.some(match => match.includes(queryLower));
            if (matchFound) {
              matchContext = matches.find(match => match.includes(queryLower)) || '';
            }
          }
        }
      }
      
      // Apply additional filters
      if (matchFound) {
        if (args.study_design && !noteContent.includes(args.study_design.toLowerCase())) {
          continue;
        }
        
        if (args.has_intervention !== undefined) {
          const hasIntervention = noteContent.includes('intervention') && 
                                 !noteContent.includes('no intervention');
          if (args.has_intervention !== hasIntervention) {
            continue;
          }
        }
        
        results.push({
          key: item.key,
          title: item.data.title,
          authors: item.data.creators || [],
          match_context: this.cleanHTMLForDisplay(matchContext),
          elicit_note_key: elicitNote.key
        });
      }
      
      if (results.length >= (args.limit || 10)) break;
    }
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            query: args.query,
            search_field: args.search_field || 'all',
            total_matches: results.length,
            results: results
          }, null, 2)
        }
      ]
    };
  }

  async getElicitSummary(includeDetails = false) {
    const items = await this.makeZoteroRequest(`/collections/${this.collectionKey}/items`, { limit: 100 });
    
    const summary = {
      total_papers: items.length,
      papers_with_elicit: 0,
      analysis_coverage: {},
      study_designs: {},
      regions: {},
      methodologies: {}
    };
    
    const detailedBreakdown = [];
    
    for (const item of items) {
      const children = await this.makeZoteroRequest(`/items/${item.key}/children`);
      
      const elicitNote = children.find(child => 
        child.data.itemType === 'note' && 
        (child.data.note?.includes('Elicit Analysis') || 
         child.data.note?.includes('elicit-analysis'))
      );
      
      if (elicitNote) {
        summary.papers_with_elicit++;
        
        const noteContent = elicitNote.data.note;
        
        // Extract study design
        const studyDesignMatch = noteContent.match(/Study Design.*?<p[^>]*>(.*?)<\/p>/i);
        if (studyDesignMatch) {
          const design = this.cleanHTMLForDisplay(studyDesignMatch[1]);
          summary.study_designs[design] = (summary.study_designs[design] || 0) + 1;
        }
        
        // Extract region
        const regionMatch = noteContent.match(/Region.*?<p[^>]*>(.*?)<\/p>/i);
        if (regionMatch) {
          const region = this.cleanHTMLForDisplay(regionMatch[1]);
          summary.regions[region] = (summary.regions[region] || 0) + 1;
        }
        
        // Count analysis fields present
        const analysisFields = [
          'Summary', 'Main Findings', 'Methodology', 'Limitations', 
          'Research Question', 'Intervention', 'Statistical Techniques'
        ];
        
        const presentFields = analysisFields.filter(field => 
          noteContent.toLowerCase().includes(field.toLowerCase())
        );
        
        presentFields.forEach(field => {
          summary.analysis_coverage[field] = (summary.analysis_coverage[field] || 0) + 1;
        });
        
        if (includeDetails) {
          detailedBreakdown.push({
            paper_key: item.key,
            paper_title: item.data.title,
            analysis_fields: presentFields,
            note_key: elicitNote.key
          });
        }
      }
    }
    
    const result = {
      summary,
      coverage_percentage: Math.round((summary.papers_with_elicit / summary.total_papers) * 100)
    };
    
    if (includeDetails) {
      result.detailed_breakdown = detailedBreakdown;
    }
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async compareMethodologies(focusArea = 'study_design', limit = 20) {
    const items = await this.makeZoteroRequest(`/collections/${this.collectionKey}/items`, { limit });
    const comparison = {};
    
    for (const item of items) {
      const children = await this.makeZoteroRequest(`/items/${item.key}/children`);
      
      const elicitNote = children.find(child => 
        child.data.itemType === 'note' && 
        (child.data.note?.includes('Elicit Analysis') || 
         child.data.note?.includes('elicit-analysis'))
      );
      
      if (!elicitNote) continue;
      
      const noteContent = elicitNote.data.note;
      let extractedValue = '';
      
      // Extract based on focus area
      switch (focusArea) {
        case 'study_design':
          const designMatch = noteContent.match(/Study Design.*?<p[^>]*>(.*?)<\/p>/i);
          extractedValue = designMatch ? this.cleanHTMLForDisplay(designMatch[1]) : 'Not specified';
          break;
        case 'statistical_techniques':
          const statsMatch = noteContent.match(/Statistical Techniques.*?<p[^>]*>(.*?)<\/p>/i);
          extractedValue = statsMatch ? this.cleanHTMLForDisplay(statsMatch[1]) : 'Not specified';
          break;
        case 'interventions':
          const interventionMatch = noteContent.match(/Intervention.*?<p[^>]*>(.*?)<\/p>/i);
          extractedValue = interventionMatch ? this.cleanHTMLForDisplay(interventionMatch[1]) : 'No intervention';
          break;
        case 'outcomes':
          const outcomeMatch = noteContent.match(/Outcome Measured.*?<p[^>]*>(.*?)<\/p>/i);
          extractedValue = outcomeMatch ? this.cleanHTMLForDisplay(outcomeMatch[1]) : 'Not specified';
          break;
      }
      
      if (!comparison[extractedValue]) {
        comparison[extractedValue] = [];
      }
      
      comparison[extractedValue].push({
        key: item.key,
        title: item.data.title,
        authors: item.data.creators || []
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            focus_area: focusArea,
            comparison_results: comparison,
            unique_approaches: Object.keys(comparison).length,
            total_papers_analyzed: Object.values(comparison).flat().length
          }, null, 2)
        }
      ]
    };
  }

  async extractResearchGaps(groupSimilar = true) {
    const items = await this.makeZoteroRequest(`/collections/${this.collectionKey}/items`, { limit: 50 });
    const gaps = [];
    
    for (const item of items) {
      const children = await this.makeZoteroRequest(`/items/${item.key}/children`);
      
      const elicitNote = children.find(child => 
        child.data.itemType === 'note' && 
        (child.data.note?.includes('Elicit Analysis') || 
         child.data.note?.includes('elicit-analysis'))
      );
      
      if (!elicitNote) continue;
      
      const noteContent = elicitNote.data.note;
      
      // Extract research gaps
      const gapsMatch = noteContent.match(/Research Gaps.*?<p[^>]*>(.*?)<\/p>/i);
      if (gapsMatch) {
        const gapText = this.cleanHTMLForDisplay(gapsMatch[1]);
        if (gapText && gapText !== 'Not specified' && gapText.length > 10) {
          gaps.push({
            paper_key: item.key,
            paper_title: item.data.title,
            research_gap: gapText
          });
        }
      }
      
      // Also extract from Future Research section
      const futureMatch = noteContent.match(/Future Research.*?<p[^>]*>(.*?)<\/p>/i);
      if (futureMatch) {
        const futureText = this.cleanHTMLForDisplay(futureMatch[1]);
        if (futureText && futureText !== 'Not specified' && futureText.length > 10) {
          gaps.push({
            paper_key: item.key,
            paper_title: item.data.title,
            research_gap: futureText,
            type: 'future_research'
          });
        }
      }
    }
    
    let result = {
      total_gaps_identified: gaps.length,
      gaps: gaps
    };
    
    if (groupSimilar) {
      // Simple keyword-based grouping
      const grouped = {};
      const keywords = ['machine learning', 'intervention', 'longitudinal', 'causal', 'randomized', 'sample size', 'methodology'];
      
      keywords.forEach(keyword => {
        const relatedGaps = gaps.filter(gap => 
          gap.research_gap.toLowerCase().includes(keyword)
        );
        if (relatedGaps.length > 0) {
          grouped[keyword] = relatedGaps;
        }
      });
      
      result.grouped_gaps = grouped;
    }
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async getCollectionOverview() {
    const items = await this.makeZoteroRequest(`/collections/${this.collectionKey}/items`, { limit: 500 });
    
    // Count by item type
    const typeCount = {};
    const yearCount = {};
    const authorCount = {};
    const tagCount = {};
    
    items.forEach(item => {
      const type = item.data.itemType;
      typeCount[type] = (typeCount[type] || 0) + 1;
      
      // Extract year from date
      if (item.data.date) {
        const year = new Date(item.data.date).getFullYear();
        if (!isNaN(year)) {
          yearCount[year] = (yearCount[year] || 0) + 1;
        }
      }
      
      // Count authors
      if (item.data.creators) {
        item.data.creators.forEach(creator => {
          const name = `${creator.firstName || ''} ${creator.lastName || ''}`.trim();
          if (name) {
            authorCount[name] = (authorCount[name] || 0) + 1;
          }
        });
      }
      
      // Count tags
      if (item.data.tags) {
        item.data.tags.forEach(tagObj => {
          const tagName = tagObj.tag || tagObj;
          tagCount[tagName] = (tagCount[tagName] || 0) + 1;
        });
      }
    });
    
    // Sort and limit results
    const topTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
      
    const recentYears = Object.entries(yearCount)
      .sort((a, b) => b[0] - a[0])
      .slice(0, 15);
      
    const topAuthors = Object.entries(authorCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
      
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            collection_key: this.collectionKey,
            total_items: items.length,
            overview: {
              item_types: topTypes.map(([type, count]) => ({ type, count })),
              years: recentYears.map(([year, count]) => ({ year: parseInt(year), count })),
              top_authors: topAuthors.map(([name, count]) => ({ name, papers: count })),
              top_tags: topTags.map(([tag, count]) => ({ tag, count }))
            }
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Zotero Single Collection MCP server running on stdio");
  }
}

// Configuration check
if (!process.env.ZOTERO_API_KEY || !process.env.ZOTERO_USER_ID || !process.env.ZOTERO_COLLECTION_KEY) {
  console.error("Error: Required environment variables are missing:");
  console.error("  ZOTERO_API_KEY - Get from https://www.zotero.org/settings/keys");
  console.error("  ZOTERO_USER_ID - Your numeric Zotero user ID");
  console.error("  ZOTERO_COLLECTION_KEY - The specific collection key to access");
  console.error("\nTo find your collection key:");
  console.error("  1. Go to your Zotero library online");
  console.error("  2. Navigate to the collection you want to use");
  console.error("  3. Look at the URL: /groups/XXXXX/collections/COLLECTION_KEY");
  console.error("     or /users/XXXXX/collections/COLLECTION_KEY");
  process.exit(1);
}

const server = new ZoteroSingleCollectionMCPServer();
server.run().catch(console.error);