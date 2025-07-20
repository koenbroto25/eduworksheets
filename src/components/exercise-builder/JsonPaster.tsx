import React, { useState } from 'react';
import { Button } from '../common/Button';

interface JsonPasterProps {
  onJsonPaste: (jsonData: any) => void;
}

export const JsonPaster: React.FC<JsonPasterProps> = ({ onJsonPaste }) => {
  const [pastedText, setPastedText] = useState('');
  const [error, setError] = useState('');

  const handleProcessJson = () => {
    setError('');
    if (!pastedText.trim()) {
      onJsonPaste([]);
      return;
    }

    let textToParse = pastedText;
    const markdownMatch = pastedText.match(/```(json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[2]) {
      textToParse = markdownMatch[2].trim();
    }

    let startIndex = -1;
    let openChar = '';
    let closeChar = '';

    const firstBracket = textToParse.indexOf('[');
    const firstBrace = textToParse.indexOf('{');

    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      startIndex = firstBracket;
      openChar = '[';
      closeChar = ']';
    } else if (firstBrace !== -1) {
      startIndex = firstBrace;
      openChar = '{';
      closeChar = '}';
    }

    if (startIndex !== -1) {
      let depth = 0;
      let endIndex = -1;
      let inString = false;

      for (let i = startIndex; i < textToParse.length; i++) {
        const char = textToParse[i];
        
        if (char === '"' && (i === 0 || textToParse[i - 1] !== '\\')) {
          inString = !inString;
        }

        if (!inString) {
          if (char === openChar) {
            depth++;
          } else if (char === closeChar) {
            depth--;
          }
        }

        if (depth === 0 && startIndex !== i) {
          endIndex = i;
          break;
        }
      }

      if (endIndex !== -1) {
        let jsonString = textToParse.substring(startIndex, endIndex + 1);
        jsonString = jsonString.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        try {
          const parsed = JSON.parse(jsonString);
          onJsonPaste(parsed);
          setPastedText(''); // Clear the textarea on success
        } catch (e) {
          setError('Failed to parse the provided JSON. Please check the format.');
          console.error("Failed to parse extracted JSON.", e);
        }
      } else {
        setError('Could not find a complete JSON object or array.');
      }
    } else {
      setError('No JSON object or array found in the pasted text.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="json-paste-area" className="block text-sm font-medium text-gray-700 mb-1">
          Paste AI-Generated JSON Here
        </label>
        <textarea
          id="json-paste-area"
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          className="w-full h-48 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste the entire text from your AI here..."
        />
      </div>
      <Button onClick={handleProcessJson} className="w-full">
        Process and Apply JSON
      </Button>
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};
