import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../common/Button';
import { getGeminiApiKey, saveGeminiApiKey, GEMINI_MODEL } from '../../services/aiGenerationService';

export const AISettingsSection: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const key = getGeminiApiKey();
    if (key) setApiKey(key);
  }, []);

  const handleSave = () => {
    saveGeminiApiKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Key className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pengaturan AI - Gemini API Key</h3>
          <p className="text-sm text-gray-500">
            Diperlukan untuk fitur pembuatan soal otomatis. Model: <strong>{GEMINI_MODEL}</strong>
          </p>
        </div>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Mengapa perlu API key sendiri?</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Layanan AI tetap <strong>gratis</strong> — Google menyediakan kuota gratis yang cukup untuk guru</li>
          <li>API key Anda bersifat pribadi dan hanya tersimpan di perangkat Anda</li>
          <li>Tidak ada biaya tambahan selama dalam batas kuota gratis Google</li>
          <li>Cara mendapat API key: buka <strong>aistudio.google.com/apikey</strong> → Create API Key</li>
        </ul>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <button
              onClick={() => setShowKey(s => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {apiKey && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> API key tersimpan di perangkat ini
            </p>
          )}
        </div>

        <Button onClick={handleSave} disabled={!apiKey.trim()}>
          {saved ? <><CheckCircle className="h-4 w-4 mr-2" />Tersimpan!</> : <><Save className="h-4 w-4 mr-2" />Simpan API Key</>}
        </Button>
      </div>
    </div>
  );
};