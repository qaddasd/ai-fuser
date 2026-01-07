export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: 'text'; text?: string } | { type: 'image_url'; image_url?: { url: string } }>;
  reasoning_content?: string;
  model?: string;
}

export interface AIModel {
  name: string;
  description?: string;
  modality: 'text' | 'image' | 'sound';
  'can-tools'?: boolean;
  'can-stream'?: boolean;
  'can-think'?: boolean;
  cost?: number;
  status?: string;
  owner?: string;
}

export interface ModelsResponse {
  'api-version': string;
  models: Record<string, AIModel>;
  classified?: {
    text?: Record<string, AIModel>;
    image?: Record<string, AIModel>;
    sound?: Record<string, AIModel>;
  };
}

let cachedModels: Record<string, AIModel> | null = null;

export async function fetchModels(): Promise<Record<string, AIModel>> {
  if (cachedModels) return cachedModels;

  try {
    const response = await fetch('https://api.onlysq.ru/ai/models');
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }
    const data: ModelsResponse = await response.json();
    cachedModels = data.models || {};
    return cachedModels;
  } catch (error) {
    console.error('Error fetching models:', error);
    return {};
  }
}

// Get only text models
export async function fetchTextModels(): Promise<Record<string, AIModel>> {
  const models = await fetchModels();
  return Object.fromEntries(
    Object.entries(models).filter(([_, model]) => model.modality === 'text')
  );
}

// Get only image models
export async function fetchImageModels(): Promise<Record<string, AIModel>> {
  const models = await fetchModels();
  return Object.fromEntries(
    Object.entries(models).filter(([_, model]) => model.modality === 'image')
  );
}

// Check if model supports thinking/reasoning
export function isReasoningModel(model: AIModel): boolean {
  return model['can-think'] === true;
}

// Check if model is for image generation
export function isImageModel(model: AIModel): boolean {
  return model.modality === 'image';
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const IMAGE_GEN_PROMPT = `You are an AI assistant with the ability to generate images. When the user asks you to create, draw, generate, or make an image, picture, illustration, or any visual content, you MUST respond with a special command in this exact format:

genimg [detailed prompt describing the image IN ENGLISH]

IMPORTANT: The prompt after "genimg" MUST ALWAYS be written in English, even if the user writes in another language. Translate the user's request to English for the image prompt.

For example:
- User: "Нарисуй закат над горами"
- You: genimg A breathtaking sunset over majestic mountain peaks, with vibrant orange and purple hues painting the sky, golden light reflecting off snow-capped summits

- User: "Draw a cat playing piano"
- You: genimg A fluffy orange cat sitting at a grand piano, paws on the keys, in a cozy room with warm lighting

Always make the prompt detailed and descriptive in English for best results. If the user doesn't ask for image generation, respond normally without using the genimg command.`;

interface ChatResponse {
  content: string;
  reasoning_content?: string;
}

export async function sendChatRequest(
  model: string,
  messages: Message[],
  systemPrompt?: string,
  reasoningLevel?: string,
  onMessage?: (chunk: string, reasoning?: string) => void
): Promise<ChatResponse> {
  const apiMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  if (systemPrompt) {
    apiMessages.unshift({ role: 'system', content: systemPrompt });
  }

  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      reasoning_level: reasoningLevel,
      stream: !!onMessage,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Chat request failed: ${error}`);
  }

  if (onMessage && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let fullReasoning = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          if (line.includes('[DONE]')) break;
          try {
            const data = JSON.parse(line.slice(6));
            const delta = data.choices?.[0]?.delta;
            if (delta) {
              const content = delta.content || '';
              const reasoning = delta.reasoning_content || '';

              fullContent += content;
              fullReasoning += reasoning;

              onMessage(content, reasoning);
            }
          } catch (e) {
            console.error('Error parsing SSE chunk:', e);
          }
        }
      }
    }

    return {
      content: fullContent,
      reasoning_content: fullReasoning || undefined,
    };
  }

  const data = await response.json();

  return {
    content: data.content || data.message || '',
    reasoning_content: data.reasoning_content,
  };
}

export async function generateImage(prompt: string, model: string = 'flux-2-dev', files?: string[], ratio: string = '1:1'): Promise<string> {
  const body: any = { prompt, model, ratio };
  if (files && files.length > 0) {
    body.files = files;
  }

  const response = await fetch('/api/ai/imagen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Image generation failed: ${error}`);
  }

  const data = await response.json();

  if (data.files && data.files.length > 0) {
    return `data:image/png;base64,${data.files[0]}`;
  }

  if (data.url) {
    return data.url;
  }

  if (data.image) {
    return `data:image/png;base64,${data.image}`;
  }

  throw new Error('No image in response');
}

