export interface AIResponse {
    text: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface AIProvider {
    name: string;
    generateContent(prompt: string): Promise<AIResponse>;
}
