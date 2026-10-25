// Browser-side call to POST /api/jokes. Behavior depends on error.code only.
import type { JokeErrorCode } from "@/lib/domain/errors";
import {
  JokeErrorResponseSchema,
  JokeSuccessResponseSchema,
} from "@/lib/domain/schemas";

export type JokeResultData =
  | { ok: true; joke: string }
  | { ok: false; code: JokeErrorCode };

export async function requestJoke(topic: string): Promise<JokeResultData> {
  let response: Response;
  try {
    response = await fetch("/api/jokes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, code: "NETWORK_ERROR" };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, code: "INTERNAL_ERROR" };
  }

  if (response.ok) {
    const success = JokeSuccessResponseSchema.safeParse(body);
    return success.success
      ? { ok: true, joke: success.data.joke }
      : { ok: false, code: "INTERNAL_ERROR" };
  }

  const failure = JokeErrorResponseSchema.safeParse(body);
  return { ok: false, code: failure.success ? failure.data.error.code : "INTERNAL_ERROR" };
}
