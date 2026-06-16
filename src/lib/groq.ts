// Thin Groq API client used by all AI features (roadmaps, quizzes, reports,
// skill-map suggestions). Uses native fetch — no SDK dependency.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.1-8b-instant";

export class GroqConfigError extends Error {
  constructor() {
    super("GROQ_API_KEY not configured");
    this.name = "GroqConfigError";
  }
}

type GroqOptions = {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
};

async function chat(
  { system, user, temperature = 0.7, maxTokens = 4096 }: GroqOptions,
  jsonMode: boolean
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new GroqConfigError();

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? DEFAULT_MODEL,
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq API error (${res.status}): ${detail.slice(0, 500)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Groq API returned an unexpected response shape");
  }
  return content;
}

/** Returns plain text from the model (e.g. weekly report markdown). */
export function groqText(opts: GroqOptions): Promise<string> {
  return chat(opts, false);
}

/**
 * Returns parsed JSON from the model. The system/user prompts MUST instruct the
 * model to reply with a single JSON object (json mode enforces an object).
 */
export async function groqJSON<T = unknown>(opts: GroqOptions): Promise<T> {
  const raw = await chat({ ...opts, temperature: opts.temperature ?? 0.4 }, true);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("Groq API did not return valid JSON");
  }
}
