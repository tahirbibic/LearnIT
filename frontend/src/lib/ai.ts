
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
