import { NextResponse } from 'next/server';

const ONLYSQ_MODELS_URL = 'https://api.onlysq.ru/ai/models';

export async function GET() {
    try {
        const response = await fetch(ONLYSQ_MODELS_URL, {
            headers: {
                'Authorization': 'Bearer openai',
            },
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            console.error('Failed to fetch models:', response.status);
            return NextResponse.json(getDefaultModels());
        }

        const data = await response.json();

        const models: Record<string, { name: string; description: string; canStream: boolean }> = {};

        if (data.models) {
            for (const [id, model] of Object.entries(data.models) as any) {
                if (model.status === 'work') {
                    models[id] = {
                        name: model.name || id,
                        description: model.description || '',
                        canStream: model['can-stream'] ?? true,
                    };
                }
            }
        }

        return NextResponse.json(models);
    } catch (error) {
        console.error('Error fetching models:', error);
        return NextResponse.json(getDefaultModels());
    }
}

function getDefaultModels() {
    return {
        'gemini-2.5-flash': { name: 'Gemini 2.5 Flash', description: 'Fast and efficient', canStream: true },
        'gpt-4o': { name: 'GPT-4o', description: 'OpenAI flagship model', canStream: true },
        'gpt-4-turbo': { name: 'GPT-4 Turbo', description: 'Faster GPT-4', canStream: true },
        'claude-3-opus': { name: 'Claude 3 Opus', description: 'Most capable Claude', canStream: true },
        'deepseek-r1': { name: 'DeepSeek R1', description: 'Reasoning model', canStream: false },
    };
}
