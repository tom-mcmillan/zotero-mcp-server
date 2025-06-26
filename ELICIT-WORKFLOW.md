# Elicit → Zotero → MCP Workflow

This guide shows you how to enhance your Zotero collection with rich AI analysis from Elicit.com, making it searchable through the MCP server.

## Overview

1. **Elicit.com** → Export detailed paper analysis as CSV
2. **Converter Script** → Transform CSV into readable note format  
3. **Zotero Desktop** → Manually paste note as child item
4. **MCP Server** → Automatically detects and searches enhanced metadata

## Step 1: Export from Elicit

1. Go to [Elicit.com](https://elicit.com) and analyze your papers
2. Export your analysis as CSV (includes 100+ fields of metadata)
3. Save the CSV file to your computer

## Step 2: Convert to Zotero Note

```bash
# Run the converter
node simple-elicit-converter.js "your-elicit-export.csv"

# This outputs a formatted note you can copy-paste
```

**Example Output:**
```
🤖 ELICIT ANALYSIS
Paper: Your Paper Title
Authors: Author Names
Year: 2023 | DOI: 10.1234/example

============================================================

📋 SUMMARY
Detailed summary of the paper's main contributions...

🔍 MAIN FINDINGS
- Key finding 1
- Key finding 2
- Key finding 3

⚠️ LIMITATIONS
Analysis of study limitations and potential biases...

🔬 RESEARCH DESIGN
Study Design: Randomized Controlled Trial
Research Question: What effect does X have on Y?

📊 METHODOLOGY
Statistical Techniques: Linear regression, ANOVA
Region: United States
Duration: 6 months

🏷️ QUICK TAGS
#elicit-analysis #design:rct #region:us #has-stats
```

## Step 3: Add to Zotero

1. **Open Zotero Desktop**
2. **Find your paper** in the collection
3. **Right-click** → "Add Note"
4. **Paste the converted text** into the note
5. **Save** the note (it becomes a child item)

## Step 4: MCP Enhancement

The MCP server automatically detects papers with Elicit notes and provides enhanced search:

### New MCP Capabilities:

- **`search_by_elicit_metadata`** - Search within Elicit analysis fields
- **`get_elicit_summary`** - Overview of your enhanced papers  
- **`compare_methodologies`** - Compare study designs across papers
- **`extract_research_gaps`** - Synthesize research opportunities

### Example AI Queries:

- *"Find all randomized controlled trials in my collection"*
- *"What are the main limitations across my climate change papers?"*
- *"Compare methodologies used in intervention studies"*
- *"Extract research gaps to identify future opportunities"*

## Benefits

### Before Elicit Integration:
- Basic paper metadata (title, authors, abstract)
- Simple keyword searching
- Manual analysis required

### After Elicit Integration:
- 🧠 AI-extracted insights and findings
- 🔍 Deep content analysis and methodology details
- 📊 Structured research design information
- ⚡ Advanced search across analysis fields
- 🎯 Automated research gap identification

## File Structure

```
your-zotero-mcp-repo/
├── zotero-mcp-server.js           # Main MCP server
├── simple-elicit-converter.js     # CSV → Note converter
├── test-zotero.js                 # Test scripts
├── ELICIT-WORKFLOW.md             # This guide
└── examples/
    ├── sample-elicit-export.csv
    └── sample-zotero-note.txt
```

## Tips

1. **Batch Processing**: You can convert multiple Elicit CSVs at once
2. **Consistent Tagging**: The converter adds structured tags for easy filtering
3. **Search Strategy**: Use the enhanced MCP methods to leverage the rich metadata
4. **Quality Control**: Review converted notes before adding to ensure accuracy

## Troubleshooting

**CSV not parsing correctly?**
- Ensure the CSV is from Elicit.com with standard column headers
- Check for encoding issues (should be UTF-8)

**Note too long for Zotero?**
- The converter automatically truncates very long fields
- Full detail is preserved in the original CSV

**MCP not finding enhanced papers?**
- Ensure notes contain "Elicit Analysis" in the content
- Check that notes are properly attached as child items

## Advanced Usage

For power users, you can:
- Modify the converter to focus on specific analysis fields
- Create custom search functions for your research domain
- Integrate with other research tools via the MCP protocol