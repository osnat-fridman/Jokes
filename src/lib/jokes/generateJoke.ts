// Joke generation flow (ARCHITECTURE.md, section 2.7).
import { JokeError } from "@/lib/domain/errors";
import { isTopicTooLong, normalizeTopic } from "@/lib/domain/topic";
import { isFlagged, requestJoke } from "@/lib/openai/adapter";

// Time budget from ARCHITECTURE.md, section 2.7.
export const REQUEST_BUDGET_MS = 30_000;
const MODERATION_TIMEOUT_MS = 5_000;
const GENERATION_TIMEOUT_MS = 10_000;
const MIN_TIME_FOR_RETRY_MS = 12_000;

// A step gets its own budget, but never more than what is left of the request.
function stepTimeout(deadline: number, budgetMs: number): number {
  const left = deadline - Date.now();
  if (left <= 0) throw new JokeError("AI_UNAVAILABLE");
  return Math.min(budgetMs, left);
}

// One automatic retry, only for connection failures and 5xx, and only with time to spare.
async function requestJokeWithRetry(topic: string, deadline: number) {
  try {
    return await requestJoke(topic, stepTimeout(deadline, GENERATION_TIMEOUT_MS));
  } catch (error) {
    const canRetry =
      error instanceof JokeError &&
      error.autoRetry &&
      deadline - Date.now() >= MIN_TIME_FOR_RETRY_MS;
    if (!canRetry) throw error;
    return requestJoke(topic, stepTimeout(deadline, GENERATION_TIMEOUT_MS));
  }
}

export async function generateJoke(
  rawTopic: string,
  deadline = Date.now() + REQUEST_BUDGET_MS,
): Promise<string> {
  const topic = normalizeTopic(rawTopic);
  if (isTopicTooLong(topic)) throw new JokeError("TOPIC_TOO_LONG");

  // An empty topic means a general joke, so there is nothing to moderate yet.
  if (
    topic !== "" &&
    (await isFlagged(topic, stepTimeout(deadline, MODERATION_TIMEOUT_MS)))
  ) {
    throw new JokeError("UNSAFE_TOPIC");
  }

  const output = await requestJokeWithRetry(topic, deadline);
  if (output.status === "unsuitable") throw new JokeError("UNSAFE_TOPIC");

  const joke = output.joke.trim();
  if (joke === "") throw new JokeError("INVALID_AI_RESPONSE");

  if (await isFlagged(joke, stepTimeout(deadline, MODERATION_TIMEOUT_MS))) {
    throw new JokeError("UNSAFE_OUTPUT");
  }
  return joke;
}
