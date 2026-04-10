import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";

export const maxDuration = 120; // seconds

export async function POST(req: Request) {
    try {
        const { prompt, sitemapData } = await req.json();

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: "A valid prompt is required." }, { status: 400 });
        }

        if (!Array.isArray(sitemapData) || sitemapData.length === 0) {
            return NextResponse.json({ error: "Valid sitemap data is required for analysis." }, { status: 400 });
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

        const provider = getAIProvider();
        const response = await provider.generateContent(fullPrompt);

        return NextResponse.json({
            text: response.text,
            model: response.model,
            provider: provider.name
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[AI Route Error]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
