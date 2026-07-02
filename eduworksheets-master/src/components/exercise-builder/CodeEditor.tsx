import React from 'react';
import { Copy, Download } from 'lucide-react';
import { Button } from '../common/Button';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    alert('Code copied to clipboard!');
  };

  const downloadCode = () => {
    const blob = new Blob([value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exercise.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
    } catch (error) {
      alert('Invalid JSON format. Cannot format.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Exercise JSON Code</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={formatJSON}>
            Format JSON
          </Button>
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCode}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
      
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your exercise JSON code here..."
          className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none bg-gray-50"
        />
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Example JSON Format:</h4>
        <pre className="text-sm text-blue-800 overflow-x-auto">
{`[
  {
    "tipe": "multiple_choice",
    "pertanyaan": "What is 2 + 2?",
    "jawaban": 0,
    "opsi": ["4", "3", "5", "6"],
    "penjelasan": "2 + 2 equals 4",
    "tingkat_kesulitan": "easy"
  },
  {
    "tipe": "short_answer",
    "pertanyaan": "What is the capital of Indonesia?",
    "jawaban": "Jakarta",
    "penjelasan": "Jakarta is the capital city of Indonesia",
    "tingkat_kesulitan": "easy"
  }
]`}
        </pre>
      </div>
    </div>
  );
};