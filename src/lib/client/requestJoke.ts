// Browser-side call to POST /api/jokes. Behavior depends on error.code only.
import type { JokeErrorCode } from "@/lib/domain/errors";
import {
  JokeErrorResponseSchema,
  JokeSuccessResponseSchema,
} from "@/lib/domain/schemas";

// Browser wait limit from ARCHITECTURE.md, section 2.7.
export const BROWSER_TIMEOUT_MS = 32_000;

export type JokeResultData =
  | { ok: true; joke: string }
  | { ok: false; code: JokeErrorCode };

const fail = (code: JokeErrorCode): JokeResultData => ({ ok: false, code });

// Firewall replies are not in the app's JSON format (ARCHITECTURE.md, 3.2).
function codeForForeignReply(status: number): JokeErrorCode {
  return status === 429 || status === 403 ? "AI_RATE_LIMITED" : "INTERNAL_ERROR";
}

export async function requestJoke(topic: string): Promise<JokeResultData> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return fail("NETWORK_ERROR");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BROWSER_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch("/api/jokes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
        cache: "no-store",
        signal: controller.signal,
      });
    } catch {
      return fail(controller.signal.aborted ? "AI_UNAVAILABLE" : "NETWORK_ERROR");
    }

    if (response.status === 429) return fail("AI_RATE_LIMITED");

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      if (controller.signal.aborted) return fail("AI_UNAVAILABLE");
      return fail(codeForForeignReply(response.status));
    }

    if (response.ok) {
      const success = JokeSuccessResponseSchema.safeParse(body);
      return success.success
        ? { ok: true, joke: success.data.joke }
        : fail("INTERNAL_ERROR");
    }

    const failure = JokeErrorResponseSchema.safeParse(body);
    return failure.success
      ? fail(failure.data.error.code)
      : fail(codeForForeignReply(response.status));
  } finally {
    clearTimeout(timer);
  }
}
