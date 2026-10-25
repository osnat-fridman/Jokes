// Minimal operational logging (ARCHITECTURE.md, section 3.3).
// Only these fields are allowed: never a body, topic, joke, IP or provider message.
import type { JokeErrorCode } from "@/lib/domain/errors";

type JokeFailure = {
  code: JokeErrorCode;
  durationMs: number;
  openaiRequestId?: string;
};

export function logJokeFailure({ code, durationMs, openaiRequestId }: JokeFailure) {
  console.error(
    JSON.stringify({ event: "joke_failed", code, durationMs, openaiRequestId }),
  );
}
