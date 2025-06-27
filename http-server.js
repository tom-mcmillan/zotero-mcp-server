#!/usr/bin/env node

/**
 * HTTP Server Wrapper for Zotero MCP Server
 * Provides REST API endpoints for the existing MCP server functionality
 */

import express from 'express';
import cors from 'cors';
import { ZoteroSingleCollectionMCPServer } from './zotero-mcp-server.js';

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize the MCP server instance
const mcpServer = new ZoteroSingleCollectionMCPServer();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'Zotero MCP Server HTTP API',
    version: '1.0.0',
    description: 'REST API for Zotero research collection analysis',
    endpoints: {
      'GET /health': 'Health check',
      'GET /collection/info': 'Get collection information',
      'GET /collection/items': 'List items (query params: limit, start, format)',
      'POST /collection/search': 'Search items (body: query, item_type, tag, limit)',
      'GET /collection/items/:itemKey': 'Get item details (query params: include_children)',
      'GET /collection/tags': 'Get collection tags (query params: limit)',
      'POST /collection/bibliography': 'Generate bibliography (body: item_keys, style, format, limit)',
      'GET /collection/recent': 'Get recent items (query params: limit, days)',
      'GET /collection/overview': 'Get collection overview',
      'POST /analysis/search': 'Search by analysis metadata',
      'GET /analysis/summary': 'Get analysis summary (query params: include_details)',
      'POST /analysis/compare': 'Compare methodologies',
      'GET /analysis/gaps': 'Extract research gaps (query params: group_similar)'
    },
    documentation: 'https://github.com/tom-mcmillan/zotero-mcp-server'
  });
});

// Collection endpoints
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
  console.log(`Zotero MCP HTTP Server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`API docs: http://localhost:${port}/`);
});

export default app;