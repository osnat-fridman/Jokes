// Stable error codes shared by the API and the UI (ARCHITECTURE.md, section 2.5).

export type JokeErrorCode =
  | "INVALID_REQUEST"
  | "TOPIC_TOO_LONG"
  | "UNSAFE_TOPIC"
  | "UNSAFE_OUTPUT"
  | "AI_RATE_LIMITED"
  | "INVALID_AI_RESPONSE"
  | "AI_UNAVAILABLE"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR";

// NETWORK_ERROR is decided in the browser only, so it has no HTTP status.
export const ERRORS: Record<
  JokeErrorCode,
  { status: number | null; retryable: boolean }
> = {
  INVALID_REQUEST: { status: 400, retryable: false },
  TOPIC_TOO_LONG: { status: 400, retryable: false },
  UNSAFE_TOPIC: { status: 422, retryable: false },
  UNSAFE_OUTPUT: { status: 422, retryable: true },
  AI_RATE_LIMITED: { status: 429, retryable: true },
  INVALID_AI_RESPONSE: { status: 502, retryable: true },
  AI_UNAVAILABLE: { status: 503, retryable: true },
  INTERNAL_ERROR: { status: 500, retryable: true },
  NETWORK_ERROR: { status: null, retryable: true },
};

export const ERROR_CODES = Object.keys(ERRORS) as [
  JokeErrorCode,
  ...JokeErrorCode[],
];

export class JokeError extends Error {
  readonly code: JokeErrorCode;

  constructor(code: JokeErrorCode) {
    super(code);
    this.name = "JokeError";
    this.code = code;
  }
}
