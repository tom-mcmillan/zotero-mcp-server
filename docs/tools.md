# Tools Reference

Climate Index provides 10 powerful research analysis tools accessible through Claude. Here's a complete reference:

## Overview Tools

### `get_overview`
Get basic information about the research collection.

**What it does**: Returns collection name, description, total paper count, and basic metadata.

**Example queries**:
- "What's in this research collection?"
- "Tell me about the climate index database"
- "Give me collection information"

---

### `get_collection_overview` 
Get comprehensive statistics about the research collection.

**What it does**: Provides detailed analytics including paper types, publication years, top authors, and research topics.

**Example queries**:
- "Give me comprehensive statistics on the collection"
- "Show me the breakdown of research by year and type"
- "Who are the most prolific authors in climate finance?"

## Discovery Tools

### `index_research`
List papers in the collection with pagination support.

**What it does**: Returns formatted list of papers with titles, authors, publication dates, and metadata.

**Parameters**:
- `limit`: Number of papers to return (default: 100)
- `start`: Starting position for pagination (default: 0)
- `format`: Output format - "json", "bibtex", or "ris"

**Example queries**:
- "List the first 50 papers in the collection"
- "Show me recent papers in BibTeX format"
- "Index all research papers"

---

### `search_research`
Search for specific papers by keywords, topics, or metadata.

**What it does**: Searches titles, abstracts, and metadata across the entire collection.

**Parameters**:
- `query`: Search terms (required)
- `item_type`: Filter by document type (e.g., "journalArticle", "report")
- `limit`: Maximum results to return (default: 100)

**Example queries**:
- "Search for papers about real estate climate risk"
- "Find research on insurance and climate change"
- "Look for studies about carbon pricing"

---

### `get_details`
Get detailed information about a specific paper.

**What it does**: Returns comprehensive metadata, abstract, authors, publication details, and attached notes for a specific paper.

**Parameters**:
- `item_key`: Unique identifier for the paper (required)
- `include_children`: Include attached notes and files (default: false)

**Example queries**:
- "Show me details for paper [key]"
- "Get full information about this study including notes"

## Analysis Tools

### `search_structured_analysis`
Search within structured analysis notes attached to papers.

**What it does**: Searches through detailed analysis content including methodology, findings, and limitations.

**Parameters**:
- `query`: Search terms (required)
- `search_field`: Specific field to search ("summary", "findings", "methodology", "limitations", "intervention", "research_question", or "all")
- `study_design`: Filter by research design type
- `has_intervention`: Filter for studies with/without interventions
- `limit`: Maximum results (default: 10)

**Example queries**:
- "Search analysis notes for 'randomized controlled trial'"
- "Find papers with machine learning methodologies"
- "Look for studies with significant limitations"

---

### `get_structured_analysis`
Get summary of structured analysis coverage across the collection.

**What it does**: Shows how many papers have detailed analysis, what fields are covered, and analysis quality metrics.

**Parameters**:
- `include_details`: Include detailed breakdown by paper (default: false)

**Example queries**:
- "How much of the collection has structured analysis?"
- "Show me analysis coverage statistics"
- "What percentage of papers have methodology analysis?"

---

### `get_methodologies`
Compare research methodologies across papers.

**What it does**: Groups papers by methodology type and compares research approaches.

**Parameters**:
- `focus_area`: What to compare ("study_design", "statistical_techniques", "interventions", "outcomes")
- `limit`: Maximum papers to analyze (default: 20)

**Example queries**:
- "Compare study designs across climate finance research"
- "What statistical techniques are used in this field?"
- "Show me different intervention approaches"

---

### `get_gaps`
Identify research opportunities and gaps.

**What it does**: Extracts and synthesizes research gaps identified across papers, grouping similar opportunities.

**Parameters**:
- `group_similar`: Attempt to group related gaps (default: true)

**Example queries**:
- "What research gaps exist in climate finance?"
- "Show me future research opportunities"
- "Where are the knowledge gaps in this field?"

## Output Tools

### `get_bibliography`
Generate formatted bibliographies from the collection.

**What it does**: Creates properly formatted citations in various academic styles.

**Parameters**:
- `item_keys`: Specific papers to include (optional - uses all if empty)
- `style`: Citation style ("apa", "chicago-note-bibliography", "mla")
- `format`: Output format ("html", "text")
- `limit`: Maximum papers if no specific keys provided (default: 50)

**Example queries**:
- "Generate an APA bibliography of climate real estate papers"
- "Create citations for the most recent 25 papers"
- "Make a bibliography in Chicago style"

## Tips for Effective Use

### Combining Tools
Use multiple tools together for comprehensive analysis:

1. Start with `get_collection_overview` to understand the scope
2. Use `search_research` to find relevant papers
3. Apply `get_methodologies` to compare approaches
4. Use `get_gaps` to identify future research directions
5. Generate `get_bibliography` for citations

### Query Optimization
- **Be specific**: "climate risk in commercial real estate" vs. "climate"
- **Use domain terms**: "discount rates", "risk pricing", "financial markets"
- **Combine concepts**: "machine learning AND climate risk assessment"

### Advanced Searches
- Search within analysis using `search_structured_analysis` for deeper insights
- Filter by document type to focus on academic papers vs. reports
- Use methodology comparison to understand research evolution