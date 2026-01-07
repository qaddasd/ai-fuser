import { NextResponse } from 'next/server';

const API_URL = 'https://api.onlysq.ru/ai/imagen';
const FALLBACK_MODEL = 'flux';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const model = body.model || 'flux-2-dev';
    const prompt = body.prompt || '';
    const files = body.files || [];
    const ratio = body.ratio || '1:1';

    console.log('Imagen request:', { model, prompt, ratio, filesCount: files.length });

    let result = await makeRequest(model, prompt, files, ratio);

    if (!result.ok && model !== FALLBACK_MODEL) {
      console.log(`${model} failed, trying ${FALLBACK_MODEL}...`);
      result = await makeRequest(FALLBACK_MODEL, prompt, files, ratio);
    }

    if (!result.ok) {
      return NextResponse.json({ error: { message: result.error } }, { status: 500 });
    }

    return NextResponse.json(result.data);

  } catch (error: any) {
    console.error('Imagen proxy error:', error);
    return NextResponse.json(
      { error: { message: error.message || 'Internal Server Error' } },
      { status: 500 }
    );
  }
}

async function makeRequest(
  model: string,
  prompt: string,
  files: string[],
  ratio: string = '1:1'
): Promise<{ ok: boolean; data?: any; error?: string }> {

  try {

    const payload: Record<string, any> = {
      model,
      prompt,
      ratio
    };

    if (files.length > 0) {

      payload.files = files.map(f => {
        if (typeof f === 'string' && f.includes(',')) {
          return f.split(',')[1];
        }
        return f;
      });
    }

    console.log(`Sending to ${API_URL}:`, payload);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer openai',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${model}):`, errorText);
      return { ok: false, error: errorText };
    }

    const data = await response.json();
    console.log(`API success (${model}):`, { hasFiles: !!data.files?.length });

    return { ok: true, data };

  } catch (err: any) {
    console.error(`Request error (${model}):`, err.message);
    return { ok: false, error: err.message };
  }
}
