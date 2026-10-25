import { ERRORS } from "./errors";

describe("ERRORS", () => {
  it("matches the status and retry rules in ARCHITECTURE.md", () => {
    expect(ERRORS).toEqual({
      INVALID_REQUEST: { status: 400, retryable: false },
      TOPIC_TOO_LONG: { status: 400, retryable: false },
      UNSAFE_TOPIC: { status: 422, retryable: false },
      UNSAFE_OUTPUT: { status: 422, retryable: true },
      AI_RATE_LIMITED: { status: 429, retryable: true },
      INVALID_AI_RESPONSE: { status: 502, retryable: true },
      AI_UNAVAILABLE: { status: 503, retryable: true },
      INTERNAL_ERROR: { status: 500, retryable: true },
      NETWORK_ERROR: { status: null, retryable: true },
    });
  });
});
