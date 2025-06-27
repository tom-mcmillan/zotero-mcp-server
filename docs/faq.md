# Frequently Asked Questions

## General Questions

### What is Climate Index?

Climate Index is a Desktop Extension for Claude that provides access to a curated collection of research papers on climate change impacts to financial markets. It enables advanced search, analysis, and bibliography generation capabilities.

### Do I need a Zotero account?

No! Climate Index comes pre-configured with access to a curated research collection. You don't need any external accounts or API keys.

### How many papers are in the collection?

The collection contains 352+ research papers focusing on climate finance, including academic articles, industry reports, regulatory documents, and policy papers.

### Is the collection updated?

The collection is curated and periodically updated with new relevant research. Updates are delivered automatically through the Desktop Extension system.

## Installation & Setup

### Why won't the extension install?

**Common solutions**:
- Ensure you have the latest version of Claude Desktop
- Try restarting Claude Desktop and installing again
- Check that you're dragging the correct `.dxt` file
- On macOS, check Security & Privacy settings if blocked

### The extension installed but isn't working

**Troubleshooting steps**:
1. Restart Claude Desktop completely
2. Check Extensions settings - ensure Climate Index shows as "Active"
3. Ask Claude: "What tools do you have access to?" - Climate Index tools should appear
4. Try a simple query: "Give me an overview of the collection"

### Can I use this on multiple devices?

Yes! Install the Climate Index extension on each device where you use Claude Desktop. Your access to the research collection will be consistent across devices.

## Using the Tools

### What's the difference between search tools?

- **`search_research`**: Searches paper titles, abstracts, and basic metadata
- **`search_structured_analysis`**: Searches within detailed analysis notes (methodology, findings, limitations)
- **`index_research`**: Lists papers without searching (good for browsing)

### How do I find papers on a specific topic?

Start with broad searches and narrow down:
```
1. "Search for papers about real estate"
2. "Find real estate papers focusing on climate risk"
3. "Search analysis notes for 'commercial real estate' methodology"
```

### Can I get papers in different citation formats?

Yes! Use the `get_bibliography` tool with different parameters:
- **APA**: "Generate APA bibliography for climate papers"
- **Chicago**: "Create Chicago-style citations"
- **BibTeX**: "Export papers in BibTeX format"

### How do I find research gaps?

Use the `get_gaps` tool:
- "What research gaps exist in climate finance?"
- "Show me future research opportunities"
- "Where are the knowledge gaps in real estate climate studies?"

## Research Workflow

### I'm new to climate finance research. Where should I start?

**Recommended workflow**:
1. "Give me an overview of the climate research collection"
2. "What are the main topics covered in this field?"
3. "Show me the most common methodologies used"
4. "Search for introductory papers on climate finance"
5. "What research gaps exist for new researchers?"

### How do I compare different research approaches?

Use the `get_methodologies` tool:
- "Compare study designs across climate finance research"
- "What statistical techniques are most common?"
- "Show me different approaches to climate risk assessment"

### Can I get detailed information about specific papers?

Yes! Use `get_details` with a paper's unique identifier:
- "Show me full details for paper ABC123"
- "Get complete information including attached notes"

## Technical Questions

### What file formats are supported for export?

**Bibliography formats**:
- APA, Chicago, MLA citation styles
- HTML and plain text output
- BibTeX and RIS formats for reference managers

### Is there a limit to how many papers I can analyze?

**Default limits** (can be adjusted in queries):
- Search results: 100 papers
- Bibliography generation: 50 papers
- Methodology comparison: 20 papers
- Gap analysis: 50 papers

### Can I access the raw data?

The tools provide structured access to all paper metadata, abstracts, and analysis notes. For specific data needs, use the detailed paper information tools.

## Troubleshooting

### Claude says it can't access the tools

**Solutions**:
1. Check that Climate Index is installed and active in Extensions
2. Restart Claude Desktop
3. Ensure you have an internet connection
4. Try reinstalling the extension

### Search results seem incomplete

**Tips for better results**:
- Use specific terminology: "climate risk premium" vs. "climate"
- Try different search terms: "real estate" vs. "property markets"
- Use the structured analysis search for deeper content
- Check if you need to increase the result limit

### The extension is slow or unresponsive

**Performance tips**:
- Reduce search result limits for faster responses
- Use specific queries rather than very broad searches
- Allow time for complex analysis operations
- Restart Claude Desktop if performance degrades

### Error messages when using tools

**Common fixes**:
- Check your internet connection
- Ensure the query syntax is correct
- Try simplifying complex queries
- Report persistent errors as GitHub issues

## Research Best Practices

### How do I cite papers from the collection?

1. Use `get_bibliography` to generate proper citations
2. Include paper identifiers for reproducibility
3. Note that you accessed papers through Climate Index
4. Follow your institution's citation guidelines

### Can I share findings with colleagues?

Yes! You can:
- Share generated bibliographies
- Reference specific paper identifiers
- Describe methodology comparisons
- Share research gap analyses
- Recommend colleagues install Climate Index for their own research

### How current is the research?

The collection includes papers from 2014-2025, with continuous updates. Use the overview tools to see publication year distributions and identify the most recent research.

## Getting Help

### Where can I report bugs or request features?

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/tom-mcmillan/zotero-mcp-server/issues)
- **Documentation**: Check this FAQ and other documentation first
- **Community**: Engage with other researchers using Climate Index

### How do I stay updated on new features?

- Climate Index automatically updates through Claude Desktop
- Follow the GitHub repository for development updates
- Check the changelog in extension settings

### Can I contribute to the collection?

The collection is professionally curated to maintain quality and focus. For suggestions on papers to include, please use the GitHub Issues system to submit recommendations with justification for inclusion.

## Advanced Usage

### Can I combine multiple search criteria?

Yes! Use natural language to combine concepts:
- "Find papers about machine learning AND climate risk"
- "Search for real estate studies using hedonic pricing"
- "Look for papers with both quantitative and qualitative methods"

### How do I research specific methodologies?

1. **Search broadly**: "Find papers using regression analysis"
2. **Compare approaches**: "Compare statistical techniques across studies"
3. **Get details**: "Show methodology details for specific papers"
4. **Analyze gaps**: "What methodological gaps exist?"

### Can I track research trends over time?

Use the collection overview and year-based analysis:
- "Show me research trends by publication year"
- "What topics were popular in different time periods?"
- "How have methodologies evolved over time?"