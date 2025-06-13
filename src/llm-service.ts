import axios, { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface OpenAIStreamChunk {
  choices: Array<{
    delta: {
      content?: string;
    };
  }>;
}

export class LLMService {
  private apiKey: string;
  private model: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env['OPENAI_API_KEY'] || '';
    this.model = process.env['OPENAI_MODEL'] || 'gpt-4o';

    if (!this.apiKey) {
      throw new Error('OpenAI API key not found. LLM functionality will use mock responses.');
    }
  }

  async sendMessage(userMessage: string, screenData?: string): Promise<string> {
    if (!this.apiKey) {
      return this.getMockResponse(userMessage, !!screenData);
    }

    try {
      const messages = this.buildMessages(userMessage, screenData);
      const response = await this.callOpenAI(messages);

      return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return this.getErrorResponse(error);
    }
  }

  async *sendMessageStream(
    userMessage: string,
    screenData?: string
  ): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      yield this.getMockResponse(userMessage, !!screenData);
      return;
    }

    try {
      const messages = this.buildMessages(userMessage, screenData);
      yield* this.callOpenAIStream(messages);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      yield this.getErrorResponse(error);
    }
  }

  private buildMessages(userMessage: string, screenData?: string): OpenAIMessage[] {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are an intelligent overlay assistant that helps users understand and interact with their screen content. 
        You have access to what the user is currently seeing on their screen. 
        Provide helpful, concise, and actionable responses.
        If you can see screen content, analyze it and provide relevant insights.
        Keep responses brief but informative.`,
      },
    ];

    if (screenData) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: userMessage,
          },
          {
            type: 'image_url',
            image_url: {
              url: screenData,
            },
          },
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: userMessage,
      });
    }

    return messages;
  }

  private async callOpenAI(messages: OpenAIMessage[]): Promise<OpenAIResponse> {
    const response: AxiosResponse<OpenAIResponse> = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: this.model,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data;
  }

  private async *callOpenAIStream(
    messages: OpenAIMessage[]
  ): AsyncGenerator<string, void, unknown> {
    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: this.model,
        messages,
        max_tokens: 500,
        temperature: 0.7,
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 30000,
      }
    );

    let buffer = '';
    const stream = response.data;

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed: OpenAIStreamChunk = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  private getMockResponse(userMessage: string, hasScreenData: boolean): string {
    const responses = [
      `I understand you're asking: "${userMessage}"`,
      hasScreenData
        ? 'I can see your screen content and would analyze it to provide relevant insights if I had access to a real LLM API.'
        : "I'd be happy to help with that question if I had access to a real LLM API.",
      'To enable full functionality, please add your OpenAI API key to the environment variables.',
      'You can copy the env.example file to .env and add your API key there.',
    ];

    return responses.join('\n\n');
  }

  private getErrorResponse(error: unknown): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return 'Invalid API key. Please check your OpenAI API key in the environment variables.';
      } else if (error.response?.status === 404) {
        return `Model "${this.model}" not found. Try using "gpt-4o" or "gpt-4" instead. Update your OPENAI_MODEL in the .env file.`;
      } else if (error.response?.status === 429) {
        return 'Rate limit exceeded. Please try again in a moment.';
      } else if (error.response?.status === 400) {
        return 'Bad request. The image might be too large or in an unsupported format.';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return 'Network error. Please check your internet connection.';
      }
    }

    return 'An unexpected error occurred. Please try again.';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
