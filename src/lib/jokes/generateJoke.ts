// Joke generation flow (ARCHITECTURE.md, section 2.7).
import { JokeError } from "@/lib/domain/errors";
import { isTopicTooLong, normalizeTopic } from "@/lib/domain/topic";
import { isFlagged, requestJoke } from "@/lib/openai/adapter";

export async function generateJoke(rawTopic: string): Promise<string> {
  const topic = normalizeTopic(rawTopic);
  if (isTopicTooLong(topic)) throw new JokeError("TOPIC_TOO_LONG");

  // An empty topic means a general joke, so there is nothing to moderate yet.
  if (topic !== "" && (await isFlagged(topic))) {
    throw new JokeError("UNSAFE_TOPIC");
  }

  const output = await requestJoke(topic);
  if (output.status === "unsuitable") throw new JokeError("UNSAFE_TOPIC");

  const joke = output.joke.trim();
  if (joke === "") throw new JokeError("INVALID_AI_RESPONSE");

  if (await isFlagged(joke)) throw new JokeError("UNSAFE_OUTPUT");
  return joke;
}
