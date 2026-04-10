import { AIProvider, AIResponse } from "./types";

const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 5000;

export class GeminiProvider implements AIProvider {
    name = "Gemini";
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateContent(prompt: string, attempt = 0): Promise<AIResponse> {
        const res = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-goog-api-key": this.apiKey,
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
            }),
        });

        // If rate-limited, wait and retry
        if (res.status === 429 && attempt < MAX_RETRIES) {
            let delay = BASE_RETRY_DELAY_MS;
            const retryAfter = res.headers.get("Retry-After");
            if (retryAfter) {
                delay = parseInt(retryAfter, 10) * 1000;
            } else {
                try {
                    const body = await res.json();
                    const retryDelayStr = body?.error?.details?.find(
                        (d: any) => d["@type"]?.includes("RetryInfo")
                    )?.retryDelay;
                    if (retryDelayStr) {
                        delay = parseInt(retryDelayStr.replace("s", ""), 10) * 1000;
                    }
                } catch { /* ignore */ }
            }

            console.log(`[Gemini] Rate limited. Retrying in ${delay / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return this.generateContent(prompt, attempt + 1);
        }

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const message = body?.error?.message || res.statusText;
            throw new Error(`[Gemini Error ${res.status}] ${message}`);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Empty response from Gemini.");

        return {
            text,
            model: "gemini-2.0-flash",
        };
    }
}
