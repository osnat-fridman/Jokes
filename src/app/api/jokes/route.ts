import { ERRORS, JokeError, type JokeErrorCode } from "@/lib/domain/errors";
import { JokeRequestSchema } from "@/lib/domain/schemas";
import { generateJoke } from "@/lib/jokes/generateJoke";
import { ERROR_MESSAGES } from "@/lib/ui/messages";

// Runs on the Node.js runtime, which is the default. The "runtime" segment
// config is not allowed together with cacheComponents, so it is not set here.

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function errorResponse(code: JokeErrorCode): Response {
  const { status, retryable } = ERRORS[code];
  return json(
    { error: { code, message: ERROR_MESSAGES[code], retryable } },
    status ?? 500,
  );
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_REQUEST");
  }

  const parsed = JokeRequestSchema.safeParse(body);
  if (!parsed.success) return errorResponse("INVALID_REQUEST");

  try {
    const joke = await generateJoke(parsed.data.topic ?? "");
    return json({ joke }, 200);
  } catch (error) {
    if (error instanceof JokeError) return errorResponse(error.code);
    // Never log the request or the joke; the code alone is enough to investigate.
    console.error("jokes: unexpected error", "INTERNAL_ERROR");
    return errorResponse("INTERNAL_ERROR");
  }
}
