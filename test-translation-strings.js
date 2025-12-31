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
                
                // Extract the translation text from all lines
                const startLine = lines[i];
                const endLine = lines[j];
                const middleLines = lines.slice(i + 1, j);
                
                // Find where the quote opens in start line
                const openIndex = startLine.indexOf(`_(${quoteChar}`);
                const textAfterOpen = startLine.substring(openIndex + 3); // After _(" or _('
                
                // Find where the quote closes in end line
                const closeIndex = endLine.indexOf(`${quoteChar})`);
                const textBeforeClose = endLine.substring(0, closeIndex);
                
                // Combine all text parts
                const allTextParts = [textAfterOpen, ...middleLines, textBeforeClose];
                const translationText = allTextParts
                  .join(' ')
                  .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
                  .trim();
                
                errors.push({
                  file: filePath,
                  startLine: lineNum,
                  endLine: j + 1,
                  content: lines.slice(i, j + 1).join('\n').trim(),
                  translationText: translationText,
                  quoteChar: quoteChar,
                  startIndex: i,
                  endIndex: j
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
 * Fix multi-line translation strings by merging them into a single line
 */
function fixMultiLineTranslations(filePath, errors) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let fixed = false;
  
  // Sort errors by line number in reverse order to avoid index shifting
  const sortedErrors = [...errors].sort((a, b) => b.startLine - a.startLine);
  
  for (const error of sortedErrors) {
    const startIdx = error.startLine - 1;
    const endIdx = error.endLine - 1;
    
    if (startIdx >= lines.length || endIdx >= lines.length) {
      continue;
    }
    
    // Get the lines involved
    const startLine = lines[startIdx];
    const endLine = lines[endIdx];
    
    // Find the position of _(" or _(' in the start line
    const quoteChar = error.quoteChar;
    const openPattern = `_(${quoteChar}`;
    const openIndex = startLine.indexOf(openPattern);
    
    if (openIndex !== -1) {
      // Find where it closes in the end line
      const closePattern = `${quoteChar})`;
      const closeIndex = endLine.indexOf(closePattern);
      
      if (closeIndex !== -1) {
        // Extract the text before the translation
        const beforeText = startLine.substring(0, openIndex);
        
        // Extract the text after the translation
        const afterText = endLine.substring(closeIndex + closePattern.length);
        
        // Build the fixed line: before + translation on one line + after
        const fixedTranslation = `${openPattern}${error.translationText}${closePattern}`;
        const newStartLine = beforeText + fixedTranslation + afterText;
        
        // Replace the multi-line with single line
        if (startIdx === endIdx) {
          // Same line (shouldn't happen, but handle it)
          lines[startIdx] = newStartLine;
        } else {
          // Multiple lines - replace start line and remove the rest
          lines[startIdx] = newStartLine;
          // Remove lines between start and end (inclusive of end, so we remove endIdx - startIdx lines)
          lines.splice(startIdx + 1, endIdx - startIdx);
        }
        
        fixed = true;
      }
    }
  }
  
  if (fixed) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    return true;
  }
  
  return false;
}

/**
 * Main test function
 */
function runTests() {
  const isPrePush = process.argv.includes('prepush');
  const shouldAutoFix = process.argv.includes('--fix') || isPrePush;
  
  if (isPrePush) {
    console.log('Running translation strings test (pre-push hook)...\n');
  } else {
    console.log('🔍 Checking for multi-line translation strings...\n');
  }
  
  const jinjaFiles = findJinjaFiles();
  let totalErrors = 0;
  const allErrors = [];
  const errorsByFile = {};
  
  for (const file of jinjaFiles) {
    const errors = checkMultiLineTranslations(file);
    if (errors.length > 0) {
      totalErrors += errors.length;
      allErrors.push(...errors);
      if (!errorsByFile[file]) {
        errorsByFile[file] = [];
      }
      errorsByFile[file].push(...errors);
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
    
    if (shouldAutoFix) {
      console.log('🔧 Attempting to auto-fix...\n');
      let fixedCount = 0;
      
      for (const [file, errors] of Object.entries(errorsByFile)) {
        if (fixMultiLineTranslations(file, errors)) {
          fixedCount++;
          logSuccess(`✅ Fixed: ${file}`);
        }
      }
      
      if (fixedCount > 0) {
        console.log(`\n✅ Auto-fixed ${fixedCount} file(s). Re-running test...\n`);
        
        // If in pre-push mode, stage the fixed files
        if (isPrePush) {
          try {
            const fixedFiles = Object.keys(errorsByFile);
            for (const file of fixedFiles) {
              execSync(`git add "${file}"`, { stdio: 'inherit' });
            }
            console.log('📝 Staged fixed files for commit.\n');
          } catch (error) {
            console.log('⚠️  Could not stage files automatically. Please stage them manually.\n');
          }
        }
        
        // Re-run the test to verify fixes
        return runTests(); // Recursive call to verify
      } else {
        logError('❌ Could not auto-fix all errors. Please fix manually.');
        logError('Example: {{ _("add to cart") }} instead of {{ _("add\\n to cart") }}');
        process.exit(1);
      }
    } else {
      logError('Please fix these translation strings to be on a single line.');
      logError('Example: {{ _("add to cart") }} instead of {{ _("add\\n to cart") }}');
      logError('Or run with --fix flag to auto-fix: node test-translation-strings.js --fix');
      process.exit(1);
    }
  } else {
    logSuccess('✅ All translation strings are on single lines!');
    process.exit(0);
  }
}

// Run the tests
runTests();

