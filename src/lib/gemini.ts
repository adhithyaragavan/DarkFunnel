import { Query } from "@/types";
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

export async function callAIMLAPI(
  messages: { role: string; content: string }[],
  jsonMode = false
): Promise<string> {
  const apiKey = process.env.AIML_API_KEY || "";
  const modelName = process.env.AIML_MODEL || "meta-llama/llama-3.1-70b-instruct";
  
  if (!apiKey) {
    throw new Error("AIML_API_KEY is not defined in environment variables");
  }
  
  const payload: Record<string, unknown> = {
    model: modelName,
    messages: messages,
    temperature: 0.1,
  };
  
  if (jsonMode) {
    payload.response_format = { type: "json_object" };
  }
  
  let attempt = 0;
  const maxRetries = 3;
  const initialDelay = 2000;
  
  while (true) {
    try {
      const res = await fetch("https://api.aimlapi.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.status === 429) {
        attempt++;
        if (attempt >= maxRetries) {
          throw new Error("AI/ML API rate limit exceeded");
        }
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`[AI/ML API Rate Limit] 429 hit. Retrying in ${(delay / 1000).toFixed(1)}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`AI/ML API returned error ${res.status}: ${errText}`);
      }
      
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`[AI/ML API Error] ${error}. Retrying in ${(delay / 1000).toFixed(1)}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

interface GeminiError {
  status?: number;
  message?: string;
  statusText?: string;
  errorDetails?: Array<Record<string, unknown>>;
}

async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 3000): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error as GeminiError;
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      
      let delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000;
      
      const is429 = err.status === 429 || 
                    (err.message && err.message.includes("429")) ||
                    (err.statusText && err.statusText.includes("429")) ||
                    (err.errorDetails && JSON.stringify(err.errorDetails).includes("429"));
                    
      if (is429) {
        if (err.errorDetails) {
          const retryInfo = err.errorDetails.find((d) => d?.['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' || d?.retryDelay);
          if (retryInfo && retryInfo.retryDelay) {
            const seconds = parseFloat(retryInfo.retryDelay as string);
            if (!isNaN(seconds)) {
              delay = seconds * 1000 + 1000;
            }
          }
        }
        console.log(`[Gemini Rate Limit] 429 hit. Retrying in ${(delay / 1000).toFixed(1)}s (Attempt ${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}export async function generateQueries(
  productDescription: string,
  icpDescription: string, 
  competitors: string[]
): Promise<Partial<Query>[]> {
  const provider = process.env.AI_PROVIDER || "gemini";
  if (provider === "aiml") {
    try {
      const systemPrompt = "You are a B2B demand generation expert who specializes in finding buying intent signals across the internet. You know exactly where buyers research solutions before making purchasing decisions. Return ONLY a valid JSON array.";
      const userPrompt = `
My product: ${productDescription}
My ideal customer: ${icpDescription}  
My competitors: ${competitors.join(", ")}

Generate 20 search queries to find people actively looking for a solution like mine or frustrated with my competitors.

Return ONLY a valid JSON array with no preamble or markdown backticks.
Each object must have:
- query_text: the exact search string to use
- source: one of: reddit, hackernews, g2, linkedin, web
- intent_type: one of: complaint, question, evaluation, switching
- rationale: one sentence why this finds buyers
`;
      const text = await callAIMLAPI([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ], true);
      
      const cleanedText = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error("Error generating queries via AI/ML API:", error);
      return [];
    }
  }

  // Fallback to Gemini
  const prompt = `
System: You are a B2B demand generation expert who specializes in finding buying intent signals across the internet. You know exactly where buyers research solutions before making purchasing decisions.

My product: ${productDescription}
My ideal customer: ${icpDescription}  
My competitors: ${competitors.join(", ")}

Generate 20 search queries to find people actively looking for a solution like mine or frustrated with my competitors.

Return ONLY a valid JSON array with no preamble or markdown backticks.
Each object must have:
- query_text: the exact search string to use
- source: one of: reddit, hackernews, g2, linkedin, web
- intent_type: one of: complaint, question, evaluation, switching
- rationale: one sentence why this finds buyers
`;

  try {
    const response = await callGeminiWithRetry(() => model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    }));
    
    const text = response.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating queries via Gemini:", error);
    return [];
  }
}

export async function scoreSignal(
  content: string,
  title: string,
  productDescription: string,
  icpDescription: string,
  competitors: string[]
) {
  const provider = process.env.AI_PROVIDER || "gemini";
  if (provider === "aiml") {
    try {
      const systemPrompt = "You are a B2B sales intelligence analyst. You evaluate web content to identify genuine buying intent signals for B2B products. You are precise and only flag content with real commercial intent. Return ONLY a valid JSON object matching the requested schema.";
      const userPrompt = `
Product being sold: ${productDescription}
Ideal customer: ${icpDescription}
Competitors: ${competitors.join(", ")}

Analyze this content and return ONLY valid JSON with no preamble.
Scoring guide:
9-10: Actively evaluating right now, high urgency
7-8: Clear buying intent, researching solutions
5-6: Warm signal, pain point identified
3-4: Loosely related, monitor only
1-2: Not relevant

Title: ${title}
Content: ${content}

Return ONLY a valid JSON object with the following keys:
- intentScore: number (1-10)
- intentLevel: string ("Hot", "Warm", or "Cold")
- signalType: string ("complaint", "question", "evaluation", "switching", or "none")
- isRelevant: boolean
- summary: string (2 sentence summary of why this is a buying signal)
- recommendedAction: string (specific action the salesperson should take)
- personName: string (nullable, name of the person if present)
- companyName: string (nullable, name of the company if present)
- sentiment: string ("positive", "negative", or "neutral" - indicating general tone/sentiment of the content)
`;
      const text = await callAIMLAPI([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ], true);
      
      const cleanedText = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error("Error scoring signal via AI/ML API:", error);
      return {
        intentScore: 1,
        intentLevel: "Cold",
        signalType: "none",
        isRelevant: false,
        summary: "Failed to score signal via AI/ML API",
        recommendedAction: "None",
        sentiment: "neutral"
      };
    }
  }

  // Fallback to Gemini
  const prompt = `
System: You are a B2B sales intelligence analyst. You evaluate web content to identify genuine buying intent signals for B2B products. You are precise and only flag content with real commercial intent.

Product being sold: ${productDescription}
Ideal customer: ${icpDescription}
Competitors: ${competitors.join(", ")}

Analyze this content and return ONLY valid JSON with no preamble.
Scoring guide:
9-10: Actively evaluating right now, high urgency
7-8: Clear buying intent, researching solutions
5-6: Warm signal, pain point identified
3-4: Loosely related, monitor only
1-2: Not relevant

Title: ${title}
Content: ${content}
`;

  const schema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      intentScore: { type: SchemaType.INTEGER, description: "1-10" },
      intentLevel: { type: SchemaType.STRING, description: "Hot, Warm, or Cold" },
      signalType: { type: SchemaType.STRING, description: "complaint, question, evaluation, switching, or none" },
      isRelevant: { type: SchemaType.BOOLEAN },
      summary: { type: SchemaType.STRING, description: "2 sentence summary of why this is a buying signal" },
      recommendedAction: { type: SchemaType.STRING, description: "specific action the salesperson should take" },
      personName: { type: SchemaType.STRING, nullable: true },
      companyName: { type: SchemaType.STRING, nullable: true },
      sentiment: { type: SchemaType.STRING, description: "positive, negative, or neutral" }
    },
    required: ["intentScore", "intentLevel", "signalType", "isRelevant", "summary", "recommendedAction", "sentiment"]
  };

  try {
    const response = await callGeminiWithRetry(() => model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    }));

    const text = response.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error scoring signal via Gemini:", error);
    return {
      intentScore: 1,
      intentLevel: "Cold",
      signalType: "none",
      isRelevant: false,
      summary: "Failed to score signal via Gemini",
      recommendedAction: "None",
      sentiment: "neutral"
    };
  }
}
