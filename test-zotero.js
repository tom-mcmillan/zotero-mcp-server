#!/usr/bin/env node

/**
 * Test script for Zotero MCP Server
 * Run this to verify your setup is working
 */

import fetch from 'node-fetch';

class ZoteroTester {
  constructor() {
    this.apiKey = process.env.ZOTERO_API_KEY;
    this.userId = process.env.ZOTERO_USER_ID;
    this.baseUrl = 'https://api.zotero.org';
  }

  async testApiConnection() {
    console.log("🔍 Testing Zotero API connection...");
    
    if (!this.apiKey || !this.userId) {
      console.error("❌ Missing ZOTERO_API_KEY or ZOTERO_USER_ID environment variables");
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${this.userId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Zotero-MCP-Tester/1.0'
        }
      });

      if (response.ok) {
        const user = await response.json();
        console.log(`✅ Successfully connected to Zotero API`);
        console.log(`   User: ${user.username || 'Unknown'}`);
        console.log(`   User ID: ${this.userId}`);
        return true;
      } else {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Connection Error: ${error.message}`);
      return false;
    }
  }

  async testCollections() {
    console.log("\n📚 Testing collections endpoint...");
    
    try {
      const response = await fetch(`${this.baseUrl}/users/${this.userId}/collections?limit=5`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Zotero-MCP-Tester/1.0'
        }
      });

      if (response.ok) {
        const collections = await response.json();
        console.log(`✅ Found ${collections.length} collections`);
        
        if (collections.length > 0) {
          console.log("   Sample collections:");
          collections.slice(0, 3).forEach(col => {
            console.log(`   - ${col.data.name} (${col.meta.numItems || 0} items)`);
          });
          return collections[0].key; // Return first collection key for further testing
        } else {
          console.log("   📝 No collections found. Consider creating some in Zotero first.");
        }
      } else {
        console.error(`❌ Collections Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Collections Error: ${error.message}`);
    }
    
    return null;
  }

  async testItems(collectionKey = null) {
    console.log("\n📄 Testing items endpoint...");
    
    const endpoint = collectionKey 
      ? `/users/${this.userId}/collections/${collectionKey}/items?limit=3`
      : `/users/${this.userId}/items?limit=3`;
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Zotero-MCP-Tester/1.0'
        }
      });

      if (response.ok) {
        const items = await response.json();
        console.log(`✅ Found ${items.length} items${collectionKey ? ' in collection' : ''}`);
        
        if (items.length > 0) {
          console.log("   Sample items:");
          items.forEach(item => {
            console.log(`   - ${item.data.title || 'Untitled'} (${item.data.itemType})`);
          });
          return items[0].key; // Return first item key for further testing
        } else {
          console.log("   📝 No items found. Add some items to your Zotero library first.");
        }
      } else {
        console.error(`❌ Items Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Items Error: ${error.message}`);
    }
    
    return null;
  }

  async testSearch() {
    console.log("\n🔎 Testing search endpoint...");
    
    try {
      const response = await fetch(`${this.baseUrl}/users/${this.userId}/items?q=the&limit=3`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Zotero-MCP-Tester/1.0'
        }
      });

      if (response.ok) {
        const items = await response.json();
        console.log(`✅ Search returned ${items.length} items for query "the"`);
        
        if (items.length > 0) {
          console.log("   Search results:");
          items.forEach(item => {
            console.log(`   - ${item.data.title || 'Untitled'}`);
          });
        }
      } else {
        console.error(`❌ Search Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Search Error: ${error.message}`);
    }
  }

  async testTags() {
    console.log("\n🏷️  Testing tags endpoint...");
    
    try {
      const response = await fetch(`${this.baseUrl}/users/${this.userId}/tags?limit=5`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Zotero-MCP-Tester/1.0'
        }
      });

      if (response.ok) {
        const tags = await response.json();
        console.log(`✅ Found ${tags.length} tags`);
        
        if (tags.length > 0) {
          console.log("   Sample tags:");
          tags.forEach(tag => {
            console.log(`   - ${tag.tag} (${tag.meta.numItems || 0} items)`);
          });
        } else {
          console.log("   📝 No tags found. Consider adding tags to your items in Zotero.");
        }
      } else {
        console.error(`❌ Tags Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Tags Error: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log("🚀 Starting Zotero MCP Server tests...\n");
    
    const apiConnected = await this.testApiConnection();
    if (!apiConnected) {
      console.log("\n❌ Cannot proceed with tests - API connection failed");
      console.log("\n🔧 Troubleshooting tips:");
      console.log("   1. Check your ZOTERO_API_KEY is correct");
      console.log("   2. Check your ZOTERO_USER_ID is correct");
      console.log("   3. Ensure your API key has library access permissions");
      console.log("   4. Verify your internet connection");
      return;
    }

    const collectionKey = await this.testCollections();
    const itemKey = await this.testItems(collectionKey);
    await this.testSearch();
    await this.testTags();

    console.log("\n🎉 Test suite completed!");
    console.log("\n📋 Summary:");
    console.log("   - If all tests passed ✅, your MCP server should work correctly");
    console.log("   - If some tests failed ❌, check the error messages above");
    console.log("   - Make sure you have some data in your Zotero library for best results");
    
    if (collectionKey && itemKey) {
      console.log(`\n🔧 Sample MCP tool calls you can try:`);
      console.log(`   - list_collections`);
      console.log(`   - get_collection_items with collection_key: "${collectionKey}"`);
      console.log(`   - get_item_details with item_key: "${itemKey}"`);
      console.log(`   - search_items with query: "research"`);
    }
  }
}

// Check for required environment variables
if (!process.env.ZOTERO_API_KEY || !process.env.ZOTERO_USER_ID) {
  console.error("❌ Missing required environment variables:");
  console.error("   ZOTERO_API_KEY - Get from https://www.zotero.org/settings/keys");
  console.error("   ZOTERO_USER_ID - Your numeric Zotero user ID");
  console.error("\n💡 Set them like this:");
  console.error("   export ZOTERO_API_KEY='your_key_here'");
  console.error("   export ZOTERO_USER_ID='your_user_id_here'");
  process.exit(1);
}

// Run the tests
const tester = new ZoteroTester();
tester.runAllTests().catch(console.error);
