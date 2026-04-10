import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";
import { AIProvider } from "./types";

export function getAIProvider(): AIProvider {
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (openaiKey && geminiKey) {
        // Create OpenAI as primary and Gemini as fallback
        return {
            name: "OpenAI (+ Gemini Fallback)",
            generateContent: async (prompt: string) => {
                try {
                    const openai = new OpenAIProvider(openaiKey, "gpt-4o");
                    console.log("[AI Wrapper] Initiating request to OpenAI (gpt-4o)...");
                    const result = await openai.generateContent(prompt);
                    console.log("[AI Wrapper] OpenAI responded successfully.");
                    return result;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error(`[AI Wrapper] OpenAI failed: ${errorMessage}`);
                    console.log("[AI Wrapper] Falling back to Gemini...");
                    const gemini = new GeminiProvider(geminiKey);
                    return await gemini.generateContent(prompt);
                }
            }
        };
    }

    if (openaiKey) {
        return new OpenAIProvider(openaiKey, "gpt-4o");
    }

    if (geminiKey) {
        return new GeminiProvider(geminiKey);
    }

    throw new Error("No AI provider (OpenAI or Gemini) configured in environment variables.");
}

export * from "./types";
