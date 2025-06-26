# Zotero MCP Server Setup Guide

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- A Zotero account with some items in your library

## Installation Steps

### 1. Create a new project directory
```bash
mkdir zotero-mcp-server
cd zotero-mcp-server
```

### 2. Initialize the project
```bash
npm init -y
```

### 3. Install dependencies
```bash
npm install @modelcontextprotocol/sdk node-fetch
```

### 4. Update package.json
Add the following to your `package.json`:
```json
{
  "type": "module",
  "scripts": {
    "start": "node zotero-mcp-server.js"
  }
}
```

### 5. Save the server code
Save the MCP server code as `zotero-mcp-server.js` in your project directory.

### 6. Set up environment variables
Create a `.env` file or export variables:

**Option A: Using .env file**
```bash
# Create .env file
echo "ZOTERO_API_KEY=your_api_key_here" > .env
echo "ZOTERO_USER_ID=your_user_id_here" >> .env

# Install dotenv to load .env file
npm install dotenv

# Modify the top of zotero-mcp-server.js to include:
import 'dotenv/config';
```

**Option B: Export directly**
```bash
export ZOTERO_API_KEY="your_api_key_here"
export ZOTERO_USER_ID="your_user_id_here"
```

### 7. Test the server
```bash
npm start
```

## Testing the Server

### Method 1: Direct Testing with curl (API validation)
Test if your Zotero API access works:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://api.zotero.org/users/YOUR_USER_ID/collections"
```

### Method 2: MCP Client Testing
You can test with a simple MCP client or use tools like:
- Claude Desktop (if configured)
- Custom MCP client scripts

### Method 3: Manual Function Testing
Add this test function to the bottom of your server file:

```javascript
// Test function - add this to test locally
async function testServer() {
  const server = new ZoteroMCPServer();
  
  try {
    // Test listing collections
    console.log("Testing collections...");
    const collections = await server.listCollections(5);
    console.log(collections);
    
    // Test searching
    console.log("\nTesting search...");
    const searchResults = await server.searchItems({ query: "climate", limit: 3 });
    console.log(searchResults);
    
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

// Uncomment to run tests
// testServer();
```

## Troubleshooting

### Common Issues:

1. **"Zotero API error: 403"** - Invalid API key or insufficient permissions
2. **"User not found"** - Wrong User ID
3. **"Module not found"** - Run `npm install` to install dependencies
4. **"Cannot use import statement"** - Make sure `"type": "module"` is in package.json

### Debug Steps:

1. Verify your API key works with a simple curl command
2. Check that your User ID is correct
3. Ensure you have items in your Zotero library
4. Check Node.js version (`node --version` should be 16+)

## Next Steps

Once the server is running:
1. Test basic functionality with the test function
2. Integrate with an MCP-compatible client
3. Try different queries and operations
4. Explore the full range of Zotero API capabilities

## Security Notes

- Keep your API key secure and never commit it to version control
- Consider using environment variables or secure configuration management
- The API key should have minimal necessary permissions
