export const GEMINI_MODEL = 'gemini-2.5-flash';

export function getGeminiApiKey(): string | null {
  return localStorage.getItem('gemini_api_key');
}

export function saveGeminiApiKey(key: string) {
  localStorage.setItem('gemini_api_key', key);
}

export async function generateQuestionsWithGemini(prompt: string, apiKey: string): Promise<any[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
      })
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Gemini API error');
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseJSONFromResponse(text);
}

export function parseJSONFromResponse(text: string): any[] {
  const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const raw = mdMatch ? mdMatch[1].trim() : text.trim();
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start !== -1 && end !== -1) {
    return JSON.parse(raw.substring(start, end + 1));
  }
  throw new Error('Tidak ditemukan JSON array dalam respons AI. Coba lagi.');
}