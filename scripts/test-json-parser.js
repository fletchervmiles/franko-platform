#!/usr/bin/env node

/**
 * Command line utility to test the JSON parser
 * Usage: node scripts/test-json-parser.js [--file=path/to/file.json]
 */

// Need to use CommonJS for direct execution via Node
const fs = require('fs');
const path = require('path');
const { extractResponseFromAIOutput } = require('../lib/utils/json-parser');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Test cases
const testCases = [
  {
    name: 'Valid JSON',
    input: '{"response": "This is a test response", "other": "field"}'
  },
  {
    name: 'JSON with trailing comma',
    input: '{"response": "This has a trailing comma",}'
  },
  {
    name: 'JSON in markdown',
    input: '```json\n{"response": "JSON inside markdown"}\n```'
  },
  {
    name: 'Single quotes',
    input: "{'response': 'Single quoted string'}"
  },
  {
    name: 'Missing quotes around keys',
    input: '{response: "Missing quotes around keys"}'
  },
  {
    name: 'Line breaks in strings',
    input: '{"response": "Line\nbreaks in strings"}'
  },
  {
    name: 'Real-world example with trailing comma',
    input: `{
      "userIntent": "User shares a positive story...",
      "currentObjectiveContext": "Objective02: Explore Past Experiences with IE Company",
      "response": "That sounds like an awesome moment to share. In what specific way did it feel like a 'huge effort' getting there?",
    }`
  },
  {
    name: 'Completely broken JSON',
    input: '{response: "broken json with unclosed string, other: 123}'
  }
];

// Parse command line arguments
const args = process.argv.slice(2);
const fileArg = args.find(arg => arg.startsWith('--file='));
const useErrorMsg = !args.includes('--no-error-msg');

// Function to test a single input
function testJsonParser(input, name = 'Custom Input') {
  console.log(`\n${colors.bold}Testing: ${colors.cyan}${name}${colors.reset}`);
  console.log(`${colors.yellow}Input:${colors.reset} ${input.substring(0, 100)}${input.length > 100 ? '...' : ''}`);
  
  try {
    const errorMsg = useErrorMsg ? "Error processing response" : undefined;
    const result = extractResponseFromAIOutput(input, 'response', errorMsg);
    
    const success = result !== input && result !== "Error processing response";
    
    console.log(`${colors.yellow}Output:${colors.reset} ${result}`);
    if (success) {
      console.log(`${colors.green}✓ Success${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Failed${colors.reset}`);
    }
    
    return success;
  } catch (error) {
    console.log(`${colors.red}Error:${colors.reset} ${error.message}`);
    return false;
  }
}

// Main function
function main() {
  console.log(`${colors.bold}${colors.blue}JSON Parser Test Utility${colors.reset}`);
  console.log(`Using error messages: ${useErrorMsg ? colors.green + 'Yes' : colors.red + 'No'}${colors.reset}`);
  
  // If a file was specified, test that
  if (fileArg) {
    const filePath = fileArg.split('=')[1];
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      testJsonParser(content, path.basename(filePath));
      return;
    } catch (error) {
      console.error(`${colors.red}Error reading file:${colors.reset} ${error.message}`);
      process.exit(1);
    }
  }
  
  // Otherwise run the test suite
  console.log(`\n${colors.bold}Running test suite...${colors.reset}`);
  
  let passCount = 0;
  let failCount = 0;
  
  testCases.forEach(testCase => {
    const success = testJsonParser(testCase.input, testCase.name);
    if (success) {
      passCount++;
    } else {
      failCount++;
    }
  });
  
  console.log(`\n${colors.bold}Test Results:${colors.reset}`);
  console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
  console.log(`${colors.bold}Success Rate: ${Math.round((passCount / testCases.length) * 100)}%${colors.reset}`);
}

// Execute the main function
main(); 