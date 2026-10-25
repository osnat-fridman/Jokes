/**
 * @jest-environment node
 */
import { APIConnectionError, APIError } from "openai";
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

function post(body: unknown) {
  return POST(
    new Request("http://localhost:3000/api/jokes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function moderation(flagged: boolean) {
  return { results: [{ flagged }] };
}

function aiOutput(parsed: unknown, status = "completed") {
  return { status, output_parsed: parsed };
}

async function expectError(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  const body = await response.json();
  expect(body.error.code).toBe(code);
  expect(typeof body.error.message).toBe("string");
  expect(typeof body.error.retryable).toBe("boolean");
  return body;
}

beforeEach(() => {
  jest.resetAllMocks();
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

  it("maps connection failures and 5xx to AI_UNAVAILABLE", async () => {
    mockParse.mockRejectedValueOnce(new APIConnectionError({ message: "down" }));
    await expectError(await post({ topic: "ים" }), 503, "AI_UNAVAILABLE");
    mockParse.mockRejectedValueOnce(new APIError(500, {}, "Server error", new Headers()));
    await expectError(await post({ topic: "ים" }), 503, "AI_UNAVAILABLE");
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
});
