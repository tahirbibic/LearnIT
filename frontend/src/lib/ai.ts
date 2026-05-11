export async function generateContentProxy(params: {
  model: string;
  contents: any[];
  systemInstruction?: string;
  generationConfig?: any;
}) {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to generate content');
  }
  return response.json();
}

export async function generateTTS(text: string, voice: string): Promise<string> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });
  if (!response.ok) throw new Error('TTS request failed');
  const data = await response.json();
  return data.audio as string;
}
