// Single entry point for all OpenAI communication.
import OpenAI, { APIConnectionError, APIError } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { JokeError } from "@/lib/domain/errors";
import { AiJokeOutputSchema, type AiJokeOutput } from "@/lib/domain/schemas";
import { JOKE_INSTRUCTIONS, buildJokeInput } from "@/lib/domain/safetyPolicy";

const MODERATION_MODEL = "omni-moderation-latest";
const MAX_OUTPUT_TOKENS = 300;

let client: OpenAI | undefined;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new JokeError("INTERNAL_ERROR");
    // The SDK retries 429s by default; ARCHITECTURE.md forbids that (see ADR-1).
    client = new OpenAI({ apiKey, maxRetries: 0 });
  }
  return client;
}

function getModel(): string {
  const model = process.env.OPENAI_MODEL;
  if (!model) throw new JokeError("INTERNAL_ERROR");
  return model;
}

// Converts SDK errors to stable codes so provider details never leave this file.
function mapOpenAIError(error: unknown): JokeError {
  if (error instanceof JokeError) return error;
  if (error instanceof APIConnectionError) return new JokeError("AI_UNAVAILABLE");
  if (error instanceof APIError) {
    if (error.status === 429) return new JokeError("AI_RATE_LIMITED");
    if (error.status !== undefined && error.status >= 500) {
      return new JokeError("AI_UNAVAILABLE");
    }
  }
  return new JokeError("INTERNAL_ERROR");
}

export async function isFlagged(text: string): Promise<boolean> {
  try {
    const result = await getClient().moderations.create({
      model: MODERATION_MODEL,
      input: text,
    });
    return result.results.some((r) => r.flagged);
  } catch (error) {
    throw mapOpenAIError(error);
  }
}

export async function requestJoke(topic: string): Promise<AiJokeOutput> {
  let response;
  try {
    response = await getClient().responses.parse({
      model: getModel(),
      store: false,
      instructions: JOKE_INSTRUCTIONS,
      input: buildJokeInput(topic),
      reasoning: { effort: "none" },
      text: {
        format: zodTextFormat(AiJokeOutputSchema, "joke"),
        verbosity: "low",
      },
      max_output_tokens: MAX_OUTPUT_TOKENS,
    });
  } catch (error) {
    throw mapOpenAIError(error);
  }

  if (response.status === "incomplete") throw new JokeError("INVALID_AI_RESPONSE");
  const parsed = AiJokeOutputSchema.safeParse(response.output_parsed);
  if (!parsed.success) throw new JokeError("INVALID_AI_RESPONSE");
  return parsed.data;
}
