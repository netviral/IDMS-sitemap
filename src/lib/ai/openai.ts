import { AIProvider, AIResponse } from "./types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAIProvider implements AIProvider {
    name = "OpenAI";
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = "gpt-4o") {
        this.apiKey = apiKey;
        this.model = model;
    }

    async generateContent(prompt: string): Promise<AIResponse> {
        const res = await fetch(OPENAI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
            }),
        });

        if (!res.ok) {
            let errorMessage = res.statusText;
            try {
                const body = await res.json();
                errorMessage = body?.error?.message || errorMessage;
            } catch {
                try {
                    const text = await res.text();
                    errorMessage = text || errorMessage;
                } catch { /* ignore */ }
            }
            throw new Error(`[OpenAI Error ${res.status}] ${errorMessage}`);
        }

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;

        if (!text) throw new Error("Empty response from OpenAI.");

        return {
            text,
            model: this.model,
            usage: {
                promptTokens: data.usage?.prompt_tokens,
                completionTokens: data.usage?.completion_tokens,
                totalTokens: data.usage?.total_tokens,
            }
        };
    }
}
