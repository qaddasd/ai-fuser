import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const API_KEY = 'openai';
const BASE_URL = 'https://api.onlysq.ru/ai/openai/';

const client = new OpenAI({
    apiKey: API_KEY,
    baseURL: BASE_URL,
});

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface ChatRequest {
    model: string;
    messages: ChatMessage[];
    reasoning_level?: string;
    stream?: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { model, messages, reasoning_level, stream = false } = body;

        const chatParams: any = {
            model: model,
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content,
            })),
            stream,
        };

        if (reasoning_level) {
            chatParams.extra = {
                reasoning: reasoning_level,
            };
        }

        console.log('Sending to OnlySq API via OpenAI SDK:', JSON.stringify(chatParams, null, 2));

        if (stream) {
            const completion = await client.chat.completions.create(chatParams);

            const stream = new ReadableStream({
                async start(controller) {
                    const encoder = new TextEncoder();
                    try {
                        for await (const chunk of (completion as any)) {
                            const text = `data: ${JSON.stringify(chunk)}\n\n`;
                            controller.enqueue(encoder.encode(text));
                        }
                        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    } catch (error) {
                        controller.error(error);
                    } finally {
                        controller.close();
                    }
                },
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        } else {
            const completion = await client.chat.completions.create(chatParams);
            const response = completion as any;

            const choice = response.choices?.[0];
            const content = choice?.message?.content || '';
            const reasoningContent = choice?.message?.reasoning_content;

            return NextResponse.json({
                content,
                reasoning_content: reasoningContent,
            });
        }
    } catch (error: any) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: error?.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
