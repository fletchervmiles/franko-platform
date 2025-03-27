import { useState, useEffect } from 'react';
import { extractResponseFromAIOutput } from '@/lib/utils/json-parser';

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

export default function TestJsonParser() {
  const [customInput, setCustomInput] = useState('');
  const [customResult, setCustomResult] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [useErrorMsg, setUseErrorMsg] = useState(true);
  const [results, setResults] = useState<Array<{name: string, input: string, output: string, success: boolean}>>([]);

  useEffect(() => {
    // Run tests on mount
    const testResults = testCases.map(test => {
      try {
        const errorMsg = useErrorMsg ? "Error processing response" : undefined;
        const output = extractResponseFromAIOutput(test.input, 'response', errorMsg);
        return {
          name: test.name,
          input: test.input,
          output,
          success: output !== test.input && output !== "Error processing response"
        };
      } catch (e) {
        return {
          name: test.name,
          input: test.input,
          output: e instanceof Error ? e.message : String(e),
          success: false
        };
      }
    });
    
    setResults(testResults);
  }, [useErrorMsg]);

  const handleCustomTest = () => {
    try {
      const errorMsg = useErrorMsg ? "Error processing response" : undefined;
      const result = extractResponseFromAIOutput(customInput, 'response', errorMsg);
      setCustomResult(result);
      setErrorMessage('');
    } catch (e) {
      setCustomResult('');
      setErrorMessage(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">JSON Parser Test Tool</h1>
      
      <div className="mb-4">
        <label className="flex items-center">
          <input 
            type="checkbox" 
            checked={useErrorMsg} 
            onChange={e => setUseErrorMsg(e.target.checked)}
            className="mr-2"
          />
          Use error message for failed parsing
        </label>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((result, index) => (
            <div key={index} className={`border p-4 rounded-lg ${result.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
              <h3 className="font-bold">{result.name}</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Input:</p>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {result.input.substring(0, 100)}
                  {result.input.length > 100 ? '...' : ''}
                </pre>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Output:</p>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {result.output}
                </pre>
              </div>
              <div className="mt-2 text-right">
                <span className={`px-2 py-1 rounded-full text-xs ${result.success ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                  {result.success ? 'Success' : 'Failed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">Custom Test</h2>
        <div>
          <label className="block mb-2">
            Enter JSON to parse:
          </label>
          <textarea 
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            className="w-full border rounded-lg p-4 h-40 font-mono text-sm"
            placeholder='{"response": "Your test response"}'
          />
        </div>
        <div className="mt-4">
          <button 
            onClick={handleCustomTest}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Test Parser
          </button>
        </div>
        
        {customResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
            <h3 className="font-semibold text-green-700">Result:</h3>
            <pre className="mt-2 bg-white p-3 rounded border text-sm overflow-x-auto">
              {customResult}
            </pre>
          </div>
        )}
        
        {errorMessage && (
          <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg">
            <h3 className="font-semibold text-red-700">Error:</h3>
            <pre className="mt-2 bg-white p-3 rounded border text-sm overflow-x-auto">
              {errorMessage}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 