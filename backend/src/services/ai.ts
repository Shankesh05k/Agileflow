import { TicketPriority, TicketType } from '../types';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TYPES: TicketType[] = ['story', 'task', 'bug', 'epic'];
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'critical'];

export interface TicketDraft {
  description: string;
  type: TicketType;
  priority: TicketPriority;
  story_points: number;
}

const SYSTEM_PROMPT = `You are an assistant embedded in an Agile project management tool.
Given a short ticket title written by a developer, draft the rest of the ticket.

Respond with ONLY a JSON object, no prose, matching exactly this shape:
{
  "description": string,   // 2-4 sentences: what needs to change and clear acceptance criteria
  "type": "story" | "task" | "bug" | "epic",
  "priority": "low" | "medium" | "high" | "critical",
  "story_points": number   // Fibonacci-ish estimate: 1, 2, 3, 5, 8, or 13
}`;

/**
 * Calls Groq's OpenAI-compatible chat completions endpoint to draft the
 * remaining ticket fields from just a title. Throws on any failure —
 * callers decide how to surface that (this is a convenience feature,
 * never a blocker for creating a ticket by hand).
 */
export async function generateTicketDraft(title: string): Promise<TicketDraft> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured on the server');
  }

  const model = process.env.GROQ_MODEL ?? 'openai/gpt-oss-20b';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: title },
        ],
        temperature: 0.4,
        max_completion_tokens: 400,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Groq request timed out');
    }
    throw new Error('Could not reach Groq API');
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Groq API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = await res.json() as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error('Groq response had no content');
  }

  let parsed: Partial<TicketDraft>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Groq response was not valid JSON');
  }

  // Never trust the model's output to already match our enums/ranges —
  // clamp and fall back to safe defaults for anything malformed.
  return {
    description: typeof parsed.description === 'string' && parsed.description.trim()
      ? parsed.description.trim().slice(0, 2000)
      : '',
    type: TYPES.includes(parsed.type as TicketType) ? (parsed.type as TicketType) : 'task',
    priority: PRIORITIES.includes(parsed.priority as TicketPriority) ? (parsed.priority as TicketPriority) : 'medium',
    story_points: clampStoryPoints(parsed.story_points),
  };
}

function clampStoryPoints(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(100, Math.max(1, Math.round(n)));
}