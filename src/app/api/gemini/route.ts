import { NextResponse } from "next/server";

const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 5000;

// Increase Next.js route timeout (Edge/Node default is 10s — we bump it up)
export const maxDuration = 120; // seconds

async function callGemini(prompt: string, apiKey: string, attempt = 0): Promise<string> {
    const res = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": apiKey,
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

        // Try to honor Retry-After header if present
        const retryAfter = res.headers.get("Retry-After");
        if (retryAfter) {
            delay = parseInt(retryAfter, 10) * 1000;
        } else {
            // Parse retry delay from body if possible
            try {
                const body = await res.json();
                const retryDelayStr = body?.error?.details?.find(
                    (d: { "@type": string; retryDelay?: string }) => d["@type"]?.includes("RetryInfo")
                )?.retryDelay;
                if (retryDelayStr) {
                    delay = parseInt(retryDelayStr.replace("s", ""), 10) * 1000;
                }
            } catch {
                // ignore parse failures
            }
        }

        console.log(`[Gemini] Rate limited. Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return callGemini(prompt, apiKey, attempt + 1);
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body?.error?.message || res.statusText;
        throw new Error(`[${res.status}] ${message}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from Gemini.");
    return text;
}

export async function POST(req: Request) {
    try {
        const { prompt, sitemapData } = await req.json();

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: "A valid prompt is required." }, { status: 400 });
        }

        if (!Array.isArray(sitemapData) || sitemapData.length === 0) {
            return NextResponse.json({ error: "Valid sitemap data is required for analysis." }, { status: 400 });
        }

        // Basic schema validation for sitemap items
        const isValid = sitemapData.every(item =>
            item && typeof item.path === 'string' && typeof item.type === 'string'
        );

        if (!isValid) {
            return NextResponse.json({ error: "Invalid sitemap data format." }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured on the server." },
                { status: 500 }
            );
        }

        const fullPrompt = `
You are a D2C growth consultant.
Given this website structure, identify:
1. Missing high-conversion pages
2. Funnel leaks
3. 3 quick wins to increase revenue
4. 1 risky but high upside idea

User Instructions/Context: "${prompt}"

Sitemap Data (${sitemapData?.length ?? 0} URLs):
${JSON.stringify(sitemapData, null, 2)}

Provide a concise, professional analysis. Use markdown for formatting.
    `.trim();

        const text = await callGemini(fullPrompt, apiKey);
        return NextResponse.json({ text });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[Gemini Route Error]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
