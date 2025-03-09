declare module '@ai-sdk/openai' {
    export function createOpenAI(config?: {
        apiKey?: string;
        compatibility?: 'strict' | 'compatible';
    }): any;
} 