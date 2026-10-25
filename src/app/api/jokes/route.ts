import { ERRORS, JokeError, type JokeErrorCode } from "@/lib/domain/errors";
import { JokeRequestSchema } from "@/lib/domain/schemas";
import { REQUEST_BUDGET_MS, generateJoke } from "@/lib/jokes/generateJoke";
import { logJokeFailure } from "@/lib/log";
import { ERROR_MESSAGES } from "@/lib/ui/messages";

// Runs on the Node.js runtime, which is the default. The "runtime" segment
// config is not allowed together with cacheComponents, so it is not set here.

// Whole-request limit in seconds (ARCHITECTURE.md, section 5.4).
export const maxDuration = 30;

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

function isJson(request: Request): boolean {
  const type = request.headers.get("content-type") ?? "";
  return type.split(";")[0].trim().toLowerCase() === "application/json";
}

// The Origin host must match the host the request was sent to, so it works on
// any address without a fixed list. No CORS headers are ever sent.
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("host") ?? new URL(request.url).host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  const deadline = startedAt + REQUEST_BUDGET_MS;

  if (!isJson(request) || !isSameOrigin(request)) {
    return errorResponse("INVALID_REQUEST");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_REQUEST");
  }

  const parsed = JokeRequestSchema.safeParse(body);
  if (!parsed.success) return errorResponse("INVALID_REQUEST");

  try {
    const joke = await generateJoke(parsed.data.topic ?? "", deadline);
    return json({ joke }, 200);
  } catch (error) {
    const known = error instanceof JokeError;
    const code = known ? error.code : "INTERNAL_ERROR";
    logJokeFailure({
      code,
      durationMs: Date.now() - startedAt,
      openaiRequestId: known ? error.requestId : undefined,
    });
    return errorResponse(code);
  }
}
