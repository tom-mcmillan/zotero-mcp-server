# Climate Index Desktop Extension

A one-click installable MCP server for analyzing climate research in Zotero.

## Installation

1. Download the `climate-index.dxt` file
2. Drag it into Claude Desktop's Settings window
3. Enter your Zotero credentials:
   - API Key: Get from https://www.zotero.org/settings/keys
   - User ID: Your numeric Zotero user ID
   - Collection Key: The specific collection to analyze
4. Click "Install"

## Features

- 🔍 Advanced search across your climate research
- 📊 Collection statistics and insights
- 🔬 Methodology comparison tools
- 📑 Bibliography generation
- 🎯 Research gap analysis

## Building the Extension

To build the .dxt file:

```bash
cd desktop-extension
npm install
npx @anthropic-ai/dxt pack
```

This creates `climate-index.dxt` ready for distribution.

## Development

The extension includes:
- `/server` - The MCP server implementation
- `/assets` - Icons and screenshots
- `manifest.json` - Extension configuration

## Support

For issues or questions, visit: https://github.com/tom-mcmillan/zotero-mcp-server/issues