// Unit tests for the JSON parser
import { extractResponseFromAIOutput, repairCommonJsonIssues } from '../lib/utils/json-parser';

describe('JSON Parser Utility', () => {
  describe('repairCommonJsonIssues', () => {
    test('removes trailing commas in objects', () => {
      const input = '{"name": "test", "value": 123,}';
      const expected = '{"name": "test", "value": 123}';
      expect(repairCommonJsonIssues(input)).toBe(expected);
    });

    test('fixes missing quotes around keys', () => {
      const input = '{name: "test"}';
      const expected = '{"name": "test"}';
      expect(repairCommonJsonIssues(input)).toBe(expected);
    });

    test('converts single quotes to double quotes', () => {
      const input = "{'name': 'test'}";
      const expected = '{"name": "test"}';
      expect(repairCommonJsonIssues(input)).toBe(expected);
    });
  });

  describe('extractResponseFromAIOutput', () => {
    test('extracts response from valid JSON', () => {
      const input = '{"response": "This is a test response", "other": "field"}';
      const expected = 'This is a test response';
      expect(extractResponseFromAIOutput(input)).toBe(expected);
    });

    test('extracts response from JSON with trailing comma', () => {
      const input = '{"response": "This has a trailing comma",}';
      const expected = 'This has a trailing comma';
      expect(extractResponseFromAIOutput(input)).toBe(expected);
    });

    test('extracts response from JSON in markdown code block', () => {
      const input = '```json\n{"response": "JSON inside markdown"}\n```';
      const expected = 'JSON inside markdown';
      expect(extractResponseFromAIOutput(input)).toBe(expected);
    });

    test('returns error message for malformed JSON that looks like JSON', () => {
      const input = '{"response": "Broken JSON with unclosed string, "other": 123}';
      const errorMessage = "Oh no, it seems there's been an error processing your last response. Please try again.";
      expect(extractResponseFromAIOutput(input, 'response', errorMessage)).toBe(errorMessage);
    });

    test('handles the real-world example with trailing comma', () => {
      const input = `{
        "userIntent": "User shares a positive story about a successful e-commerce store launch while working late in IE's Richmond office, highlighting the sense of accomplishment after a significant effort.",
        "currentObjectiveContext": "Objective02: Explore Past Experiences with IE Company",
        "currentOrganizationContext": "IE Company aims for actionable strategies and seamless implementation. The user's story reflects a successful project execution and may highlight the company's ability to deliver tangible results.",
        "thought": "The user shares details of a successful project launch. I'll ask for one more specific detail to fully explore the positive memory.",
        "Turns": "Objective02 currently at 2, incrementing to 3, leaving 1 turn remaining.",
        "moves": ["delveDeeper"],
        "currentObjectives": {
          "objective01": {
            "status": "done",
            "count": 1,
            "target": 1,
            "guidance": "completed"
          },
          "objective02": {
            "status": "current",
            "count": 3,
            "target": 4,
            "guidance": "1 turn remaining"
          },
          "objective03": {
            "status": "tbc",
            "count": 0,
            "target": 4,
            "guidance": "4 turns remaining"
          },
          "objective04": {
            "status": "tbc",
            "count": 0,
            "target": 4,
            "guidance": "4 turns remaining"
          },
          "objective05": {
            "status": "tbc",
            "count": 0,
            "target": 4,
            "guidance": "4 turns remaining"
          }
        },
        "response": "That sounds like an awesome moment to share. In what specific way did it feel like a 'huge effort' getting there?",
      }`;
      
      const expected = "That sounds like an awesome moment to share. In what specific way did it feel like a 'huge effort' getting there?";
      expect(extractResponseFromAIOutput(input)).toBe(expected);
    });
  });
}); 