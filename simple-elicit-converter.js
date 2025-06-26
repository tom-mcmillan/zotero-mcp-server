#!/usr/bin/env node

/**
 * Simple Elicit to Zotero Note Converter
 * Generates clean, copy-pasteable notes for manual Zotero entry
 */

import Papa from 'papaparse';
import fs from 'fs/promises';

class SimpleElicitConverter {
  
  async convertCSVToNote(csvFilePath) {
    const fileContent = await fs.readFile(csvFilePath, 'utf8');
    
    const parsedData = Papa.parse(fileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    if (parsedData.data.length === 0) {
      throw new Error('No data found in CSV file');
    }

    const paper = parsedData.data[0];
    return this.generateCleanNote(paper);
  }

  generateCleanNote(paper) {
    const sections = [];
    
    // Header
    sections.push(`🤖 ELICIT ANALYSIS`);
    sections.push(`Paper: ${paper.Title || 'Unknown Title'}`);
    sections.push(`Authors: ${paper.Authors || 'Unknown'}`);
    sections.push(`Year: ${paper.Year || 'Unknown'} | DOI: ${paper.DOI || 'None'}`);
    sections.push(`Generated: ${new Date().toLocaleDateString()}`);
    sections.push(`\n${'='.repeat(60)}\n`);

    // Core Analysis
    if (paper.Summary) {
      sections.push(`📋 SUMMARY`);
      sections.push(this.wrapText(paper.Summary));
      sections.push('');
    }

    if (paper['Main findings']) {
      sections.push(`🔍 MAIN FINDINGS`);
      sections.push(this.wrapText(paper['Main findings']));
      sections.push('');
    }

    if (paper.Limitations) {
      sections.push(`⚠️ LIMITATIONS`);
      sections.push(this.wrapText(paper.Limitations));
      sections.push('');
    }

    // Research Design
    sections.push(`🔬 RESEARCH DESIGN`);
    if (paper['Study design']) sections.push(`Study Design: ${paper['Study design']}`);
    if (paper['Research question']) sections.push(`Research Question: ${this.wrapText(paper['Research question'], 'Question: ')}`);
    if (paper['Study objectives']) sections.push(`Objectives: ${this.wrapText(paper['Study objectives'], 'Objectives: ')}`);
    sections.push('');

    // Methodology
    sections.push(`📊 METHODOLOGY`);
    if (paper.Methodology) sections.push(`Methods: ${this.wrapText(paper.Methodology, 'Methods: ')}`);
    if (paper['Statistical techniques']) sections.push(`Statistical Techniques: ${paper['Statistical techniques']}`);
    if (paper.Region) sections.push(`Region: ${paper.Region}`);
    if (paper.Duration) sections.push(`Duration: ${paper.Duration}`);
    sections.push('');

    // Variables & Intervention
    if (paper.Intervention || paper['Independent variables'] || paper['Dependent variables']) {
      sections.push(`🧪 VARIABLES & INTERVENTION`);
      if (paper.Intervention) sections.push(`Intervention: ${this.wrapText(paper.Intervention, 'Intervention: ')}`);
      if (paper['Independent variables']) sections.push(`Independent Variables: ${paper['Independent variables']}`);
      if (paper['Dependent variables']) sections.push(`Dependent Variables: ${paper['Dependent variables']}`);
      if (paper['Outcome measured']) sections.push(`Outcomes: ${paper['Outcome measured']}`);
      sections.push('');
    }

    // Research Context
    if (paper['Research gaps'] || paper['Future research']) {
      sections.push(`🚀 RESEARCH CONTEXT`);
      if (paper['Research gaps']) sections.push(`Research Gaps: ${this.wrapText(paper['Research gaps'], 'Gaps: ')}`);
      if (paper['Future research']) sections.push(`Future Research: ${this.wrapText(paper['Future research'], 'Future: ')}`);
      if (paper['Policy recommendations']) sections.push(`Policy Recommendations: ${this.wrapText(paper['Policy recommendations'], 'Policy: ')}`);
      sections.push('');
    }

    // Quick Reference Tags
    const tags = [];
    if (paper['Study design']) tags.push(`design:${paper['Study design'].toLowerCase().replace(/\s+/g, '-')}`);
    if (paper.Region) tags.push(`region:${paper.Region.toLowerCase().replace(/\s+/g, '-')}`);
    if (paper['Statistical techniques']) tags.push('has-stats');
    if (paper.Intervention) tags.push('has-intervention');
    
    sections.push(`🏷️ QUICK TAGS`);
    sections.push(`#elicit-analysis ${tags.map(tag => '#' + tag).join(' ')}`);
    sections.push('');

    // Evidence indicator
    const evidenceCount = Object.keys(paper).filter(key => 
      key.startsWith('Supporting quotes for') && paper[key]
    ).length;
    
    if (evidenceCount > 0) {
      sections.push(`📚 EVIDENCE AVAILABLE`);
      sections.push(`This analysis includes supporting quotes for ${evidenceCount} sections.`);
      sections.push(`(Supporting evidence available in original Elicit export)`);
    }

    return sections.join('\n');
  }

  wrapText(text, prefix = '') {
    if (!text) return '';
    
    // Clean and wrap text for readability
    const cleaned = text.toString().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const maxWidth = 80 - prefix.length;
    
    const words = cleaned.split(' ');
    const lines = [];
    let currentLine = prefix;
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 > maxWidth && currentLine !== prefix) {
        lines.push(currentLine);
        currentLine = ' '.repeat(prefix.length) + word;
      } else {
        if (currentLine === prefix) {
          currentLine += word;
        } else {
          currentLine += ' ' + word;
        }
      }
    }
    
    if (currentLine.trim()) {
      lines.push(currentLine);
    }
    
    return lines.join('\n');
  }

  // Method to process and save note
  async processFile(inputPath, outputPath = null) {
    try {
      console.log(`Processing: ${inputPath}`);
      
      const noteContent = await this.convertCSVToNote(inputPath);
      
      // Default output path
      if (!outputPath) {
        const inputName = inputPath.replace(/\.csv$/i, '');
        outputPath = `${inputName}-zotero-note.txt`;
      }
      
      await fs.writeFile(outputPath, noteContent, 'utf8');
      
      console.log(`✅ Note generated: ${outputPath}`);
      console.log(`\n📋 COPY-PASTE READY:`);
      console.log(`${'='.repeat(50)}`);
      console.log(noteContent);
      console.log(`${'='.repeat(50)}`);
      console.log(`\n💡 Instructions:`);
      console.log(`1. Copy the text above`);
      console.log(`2. In Zotero Desktop, right-click your paper`);
      console.log(`3. Select "Add Note"`);
      console.log(`4. Paste the content`);
      console.log(`5. Save the note`);
      
      return noteContent;
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🤖 Elicit to Zotero Note Converter

Usage:
  node simple-elicit-converter.js <input.csv> [output.txt]

Example:
  node simple-elicit-converter.js "my-elicit-export.csv"
  node simple-elicit-converter.js "research.csv" "research-note.txt"

This will generate a clean, formatted note that you can copy-paste
directly into Zotero Desktop as a note attached to your paper.
`);
    process.exit(0);
  }
  
  const inputFile = args[0];
  const outputFile = args[1];
  
  const converter = new SimpleElicitConverter();
  
  try {
    await converter.processFile(inputFile, outputFile);
  } catch (error) {
    console.error('Failed to convert file:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SimpleElicitConverter };