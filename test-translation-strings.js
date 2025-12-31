#!/usr/bin/env node

/**
 * Test script to check for translation strings split across multiple lines
 * This ensures all _("...") translation strings are on a single line
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

function logError(message) {
  console.error(`${colors.red}${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}${message}${colors.reset}`);
}

function logWarning(message) {
  console.warn(`${colors.yellow}${message}${colors.reset}`);
}

/**
 * Find all .jinja files in the project
 */
function findJinjaFiles(dir = '.') {
  const files = [];
  
  function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      // Skip node_modules, .git, and other common ignore directories
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'libraries', 'dist', 'build'].includes(entry.name)) {
          walkDir(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.jinja')) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(dir);
  return files;
}

/**
 * Check if a translation string is split across multiple lines
 */
function checkMultiLineTranslations(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const errors = [];
  
  // Pattern to match _(" or _(' at the start or middle of a line
  const translationStartPattern = /_\(["']/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Check if this line starts a translation but doesn't close it
    if (translationStartPattern.test(line)) {
      // Check if the translation string closes on the same line
      const quoteChar = line.match(/_\((["'])/)?.[1];
      
      if (quoteChar) {
        // Find the opening quote position after _(
        const openQuoteIndex = line.indexOf(`_(${quoteChar}`);
        if (openQuoteIndex !== -1) {
          const afterOpenQuote = line.substring(openQuoteIndex + 3); // After _(" or _('
          
          // Check if the quote is closed on the same line
          const closeQuoteIndex = afterOpenQuote.indexOf(`${quoteChar})`);
          
          // If not closed on same line, check if next line continues it
          if (closeQuoteIndex === -1) {
            // This is a multi-line translation string
            let foundClose = false;
            let j = i + 1;
            
            // Look ahead to find where it closes
            while (j < lines.length && j < i + 10) { // Limit search to 10 lines ahead
              if (lines[j].includes(`${quoteChar})`)) {
                foundClose = true;
                errors.push({
                  file: filePath,
                  startLine: lineNum,
                  endLine: j + 1,
                  content: lines.slice(i, j + 1).join('\n').trim()
                });
                break;
              }
              j++;
            }
          }
        }
      }
    }
  }
  
  return errors;
}

/**
 * Main test function
 */
function runTests() {
  console.log('🔍 Checking for multi-line translation strings...\n');
  
  const jinjaFiles = findJinjaFiles();
  let totalErrors = 0;
  const allErrors = [];
  
  for (const file of jinjaFiles) {
    const errors = checkMultiLineTranslations(file);
    if (errors.length > 0) {
      totalErrors += errors.length;
      allErrors.push(...errors);
    }
  }
  
  if (totalErrors > 0) {
    logError(`\n❌ Found ${totalErrors} multi-line translation string(s):\n`);
    
    allErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.file}:${error.startLine}-${error.endLine}`);
      console.log(`   Content:`);
      const lines = error.content.split('\n');
      lines.forEach((line, i) => {
        const lineNum = error.startLine + i;
        logWarning(`   ${lineNum}: ${line}`);
      });
      console.log('');
    });
    
    logError('Please fix these translation strings to be on a single line.');
    logError('Example: {{ _("add to cart") }} instead of {{ _("add\\n to cart") }}');
    process.exit(1);
  } else {
    logSuccess('✅ All translation strings are on single lines!');
    process.exit(0);
  }
}

// Run the tests
runTests();

