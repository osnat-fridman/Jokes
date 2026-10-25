/**
 * @jest-environment node
 */
import { APIConnectionError, APIConnectionTimeoutError, APIError } from "openai";
import { ERRORS } from "@/lib/domain/errors";
import { POST } from "./route";

const FAKE_KEY = "sk-test-not-a-real-key";

const mockParse = jest.fn();
const mockModerate = jest.fn();

jest.mock("openai", () => {
  const actual = jest.requireActual("openai");
  class FakeOpenAI {
    responses = { parse: (...args: unknown[]) => mockParse(...args) };
    moderations = { create: (...args: unknown[]) => mockModerate(...args) };
  }
  return { __esModule: true, ...actual, default: FakeOpenAI };
});

const SAME_ORIGIN = {
  "Content-Type": "application/json",
  Host: "localhost:3000",
  Origin: "http://localhost:3000",
};

function post(body: unknown, headers: Record<string, string> = SAME_ORIGIN) {
  return POST(
    new Request("http://localhost:3000/api/jokes", {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function without(name: keyof typeof SAME_ORIGIN) {
  const headers: Record<string, string> = { ...SAME_ORIGIN };
  delete headers[name];
  return headers;
}

function moderation(flagged: boolean) {
  return { results: [{ flagged }] };
}

function aiOutput(parsed: unknown, status = "completed") {
  return { status, output_parsed: parsed };
}

// Checks the status and retryable flag against the table in ARCHITECTURE.md 2.5.
async function expectError(
  response: Response,
  status: number,
  code: keyof typeof ERRORS,
) {
  expect(response.status).toBe(status);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  const body = await response.json();
  expect(body.error.code).toBe(code);
  expect(body.error.retryable).toBe(ERRORS[code].retryable);
  expect(body.error.message).not.toMatch(/<|>|at \w+ \(/);
  return body;
}

let errorLog: jest.SpyInstance;

beforeEach(() => {
  jest.resetAllMocks();
  errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.OPENAI_API_KEY = FAKE_KEY;
  process.env.OPENAI_MODEL = "test-model";
  mockModerate.mockResolvedValue(moderation(false));
  mockParse.mockResolvedValue(aiOutput({ status: "ok", joke: "בדיחה על חתולים" }));
});

describe("POST /api/jokes", () => {
  it("returns a joke for a safe topic, with no-store", async () => {
    const response = await post({ topic: "חתולים" });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ joke: "בדיחה על חתולים" });
    expect(mockModerate).toHaveBeenCalledTimes(2);
  });

  it("calls the Responses API statelessly with the configured model", async () => {
    await post({ topic: "חתולים" });
    const params = mockParse.mock.calls[0][0];
    expect(params).toMatchObject({
      model: "test-model",
      store: false,
      max_output_tokens: 300,
      reasoning: { effort: "none" },
    });
    expect(params.tools).toBeUndefined();
    expect(params.previous_response_id).toBeUndefined();
    expect(params.input).toContain(JSON.stringify({ topic: "חתולים" }));
    expect(mockModerate.mock.calls[0][0]).toEqual({
      model: "omni-moderation-latest",
      input: "חתולים",
    });
  });

  it("returns a general joke for an empty or missing topic", async () => {
    for (const body of [{ topic: "" }, {}]) {
      mockModerate.mockClear();
      const response = await post(body);
      expect(response.status).toBe(200);
      // Only the joke itself is moderated.
      expect(mockModerate).toHaveBeenCalledTimes(1);
    }
  });

  it("rejects a topic longer than 50 characters without calling OpenAI", async () => {
    await expectError(await post({ topic: "א".repeat(51) }), 400, "TOPIC_TOO_LONG");
    expect(mockModerate).not.toHaveBeenCalled();
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("does not call the Responses API when the topic is flagged", async () => {
    mockModerate.mockResolvedValueOnce(moderation(true));
    const body = await expectError(await post({ topic: "נושא" }), 422, "UNSAFE_TOPIC");
    expect(body.error.retryable).toBe(false);
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("returns UNSAFE_TOPIC when the model refuses the topic", async () => {
    mockParse.mockResolvedValue(aiOutput({ status: "unsuitable", joke: "" }));
    await expectError(await post({ topic: "בחירות" }), 422, "UNSAFE_TOPIC");
  });

  it("never returns a joke that output moderation flagged", async () => {
    mockModerate
      .mockResolvedValueOnce(moderation(false))
      .mockResolvedValueOnce(moderation(true));
    const response = await post({ topic: "ים" });
    const body = await expectError(response, 422, "UNSAFE_OUTPUT");
    expect(JSON.stringify(body)).not.toContain("בדיחה על חתולים");
  });

  it.each([
    ["missing parsed output", aiOutput(null)],
    ["an empty joke", aiOutput({ status: "ok", joke: " " })],
    ["a wrong structure", aiOutput({ joke: "x" })],
    ["an incomplete response", aiOutput({ status: "ok", joke: "x" }, "incomplete")],
  ])("rejects %s", async (_, output) => {
    mockParse.mockResolvedValue(output);
    await expectError(await post({ topic: "ים" }), 502, "INVALID_AI_RESPONSE");
  });

  it.each([
    ["broken JSON", "{"],
    ["an unknown field", { topic: "ים", extra: true }],
    ["a non-string topic", { topic: 7 }],
  ])("rejects %s as INVALID_REQUEST", async (_, body) => {
    await expectError(await post(body), 400, "INVALID_REQUEST");
  });

  it("maps an OpenAI 429 to AI_RATE_LIMITED", async () => {
    mockParse.mockRejectedValue(new APIError(429, {}, "Rate limit", new Headers()));
    await expectError(await post({ topic: "ים" }), 429, "AI_RATE_LIMITED");
  });

  it("maps a spend limit 429 to AI_RATE_LIMITED without retrying", async () => {
    mockParse.mockRejectedValue(
      new APIError(429, { code: "project_spend_limit_exceeded" }, "Limit", new Headers()),
    );
    await expectError(await post({ topic: "ים" }), 429, "AI_RATE_LIMITED");
    expect(mockParse).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["connection failures", () => new APIConnectionError({ message: "down" })],
    ["5xx", () => new APIError(500, {}, "Server error", new Headers())],
  ])("maps %s to AI_UNAVAILABLE after one retry", async (_, makeError) => {
    mockParse.mockRejectedValue(makeError());
    await expectError(await post({ topic: "ים" }), 503, "AI_UNAVAILABLE");
    expect(mockParse).toHaveBeenCalledTimes(2);
  });

  it("succeeds when the single retry works", async () => {
    mockParse.mockRejectedValueOnce(new APIConnectionError({ message: "down" }));
    const response = await post({ topic: "ים" });
    expect(response.status).toBe(200);
    expect(mockParse).toHaveBeenCalledTimes(2);
  });

  it("passes each step its own timeout", async () => {
    await post({ topic: "ים" });
    expect(mockModerate.mock.calls[0][1]).toEqual({ timeout: 5000 });
    expect(mockParse.mock.calls[0][1]).toEqual({ timeout: 10000 });
    expect(mockModerate.mock.calls[1][1]).toEqual({ timeout: 5000 });
  });

  it.each([
    ["input moderation", () => mockModerate.mockRejectedValueOnce(new APIConnectionTimeoutError())],
    ["generation", () => mockParse.mockRejectedValue(new APIConnectionTimeoutError())],
    [
      "output moderation",
      () =>
        mockModerate
          .mockResolvedValueOnce(moderation(false))
          .mockRejectedValueOnce(new APIConnectionTimeoutError()),
    ],
  ])("maps a timeout in %s to AI_UNAVAILABLE without retrying", async (_, arrange) => {
    arrange();
    await expectError(await post({ topic: "ים" }), 503, "AI_UNAVAILABLE");
    expect(mockParse.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it("never exposes the API key or provider messages", async () => {
    mockParse.mockRejectedValue(
      new APIError(401, {}, `Incorrect API key ${FAKE_KEY}`, new Headers()),
    );
    const response = await post({ topic: "ים" });
    const text = await response.text();
    expect(response.status).toBe(500);
    expect(text).not.toContain(FAKE_KEY);
    expect(text).not.toContain("Incorrect API key");
  });

  it("returns INTERNAL_ERROR for an unexpected failure", async () => {
    mockParse.mockRejectedValue(new Error("boom at secret place"));
    const response = await post({ topic: "ים" });
    const body = await expectError(response, 500, "INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toContain("boom");
  });
});

describe("POST /api/jokes request protection", () => {
  it.each([
    ["a foreign Origin", { ...SAME_ORIGIN, Origin: "https://evil.example" }],
    ["a missing Origin", without("Origin")],
    ["a malformed Origin", { ...SAME_ORIGIN, Origin: "not a url" }],
    ["a missing Content-Type", without("Content-Type")],
    ["a text/plain Content-Type", { ...SAME_ORIGIN, "Content-Type": "text/plain" }],
    ["a form Content-Type", { ...SAME_ORIGIN, "Content-Type": "application/x-www-form-urlencoded" }],
  ])("rejects %s without calling OpenAI", async (_, headers) => {
    await expectError(await post({ topic: "ים" }, headers), 400, "INVALID_REQUEST");
    expect(mockModerate).not.toHaveBeenCalled();
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("accepts JSON with a charset", async () => {
    const headers = { ...SAME_ORIGIN, "Content-Type": "application/json; charset=utf-8" };
    expect((await post({ topic: "ים" }, headers)).status).toBe(200);
  });
});

describe("POST /api/jokes logging", () => {
  it("logs only the code, duration and OpenAI request ID", async () => {
    const headers = new Headers({ "x-request-id": "req_123" });
    mockParse.mockRejectedValue(
      new APIError(429, {}, `Rate limit ${FAKE_KEY}`, headers),
    );
    await post({ topic: "נושא סודי" });

    expect(errorLog).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(errorLog.mock.calls[0][0]);
    expect(Object.keys(entry).sort()).toEqual(
      ["code", "durationMs", "event", "openaiRequestId"].sort(),
    );
    expect(entry).toMatchObject({ code: "AI_RATE_LIMITED", openaiRequestId: "req_123" });
  });

  it("never logs the topic, the joke or provider details", async () => {
    mockModerate
      .mockResolvedValueOnce(moderation(false))
      .mockResolvedValueOnce(moderation(true));
    await post({ topic: "נושא סודי" });
    mockParse.mockRejectedValue(new Error(`provider said ${FAKE_KEY}`));
    await post({ topic: "נושא סודי" });

    const logged = JSON.stringify(errorLog.mock.calls);
    expect(logged).not.toContain("נושא סודי");
    expect(logged).not.toContain("בדיחה על חתולים");
    expect(logged).not.toContain(FAKE_KEY);
    expect(logged).not.toContain("provider said");
  });

  it("logs nothing for a successful request", async () => {
    await post({ topic: "ים" });
    expect(errorLog).not.toHaveBeenCalled();
  });
});
