/**
 * Test utility for the robust JSON parser
 * Run this file to test the parser against known problematic inputs
 */
import { extractResponseFromAIOutput } from './json-parser';

// Test cases with issues that our parser should handle
const TEST_CASES = [
  {
    name: 'Trailing comma in object',
    input: `{
      "response": "This has a trailing comma",
    }`,
    expected: 'This has a trailing comma'
  },
  {
    name: 'JSON inside markdown',
    input: '```json\n{"response": "JSON inside markdown"}\n```',
    expected: 'JSON inside markdown'
  },
  {
    name: 'Single quotes instead of double quotes',
    input: `{
      'response': 'Single quoted string'
    }`,
    expected: 'Single quoted string'
  },
  {
    name: 'Missing quotes around keys',
    input: `{
      response: "Missing quotes around keys"
    }`,
    expected: 'Missing quotes around keys'
  },
  {
    name: 'Line breaks in strings',
    input: `{
      "response": "Line
      breaks in strings"
    }`,
    expected: 'Line\n      breaks in strings'
  },
  {
    name: 'Multiple issues combined',
    input: `{
      response: 'This has
      multiple issues',
    }`,
    expected: 'This has\n      multiple issues'
  },
  {
    name: 'Real-world example from transcript',
    input: `\`\`\`json
{
  "userIntent": "User indicates 'realigning scope late in the game' as a significant challenge or negative experience.",
  "currentObjectiveContext": "Objective05: Learn About the Client's Project Experience with IE Company",
  "currentOrganizationContext": "IE Company's brand emphasizes adaptability, suggesting that solutions remain competitive in rapidly evolving technological and market trends.",
  "thought": "Since the user identified 'realigning scope late in the game' as a challenge, I'll delve deeper to understand the impact of this challenge.",
  "Turns": "Incrementing Objective 05 count from 0 -> 1",
  "moves": ["delveDeeper"],
  "currentObjectives": {
    "objective01": {
      "status": "done",
      "count": 1,
      "target": 1,
      "guidance": "completed"
    },
    "objective02": {
      "status": "done",
      "count": 4,
      "target": 4,
      "guidance": "completed"
    },
    "objective03": {
      "status": "done",
      "count": 4,
      "target": 4,
      "guidance": "completed"
    },
    "objective04": {
      "status": "done",
      "count": 4,
      "target": 4,
      "guidance": "completed"
    },
    "objective05": {
      "status": "current",
      "count": 1,
      "target": 4,
      "guidance": "3 turns remaining"
    }
  },
  "response": "That definitely sounds tricky. Can you elaborate on how realigning the scope late in the game impacted the project or your team?",
}
\`\`\``,
    expected: "That definitely sounds tricky. Can you elaborate on how realigning the scope late in the game impacted the project or your team?"
  }
];

// Run the tests
function runTests() {
  console.log('Running JSON parser tests...\n');
  
  let passCount = 0;
  let failCount = 0;
  
  TEST_CASES.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Input: ${testCase.input.substring(0, 50)}${testCase.input.length > 50 ? '...' : ''}`);
    
    try {
      const result = extractResponseFromAIOutput(testCase.input);
      console.log(`Result: ${result.substring(0, 50)}${result.length > 50 ? '...' : ''}`);
      
      if (result === testCase.expected) {
        console.log('✅ PASS');
        passCount++;
      } else {
        console.log('❌ FAIL');
        console.log(`Expected: ${testCase.expected}`);
        failCount++;
      }
    } catch (error) {
      console.log('💥 ERROR:', error);
      failCount++;
    }
    
    console.log('-------------------\n');
  });
  
  console.log(`Test Results: ${passCount} passed, ${failCount} failed`);
  console.log(`Success Rate: ${Math.round((passCount / TEST_CASES.length) * 100)}%`);
}

// Export the test runner for use in other files
export { runTests };

// Automatically run the tests when this file is executed directly
if (require.main === module) {
  runTests();
} 