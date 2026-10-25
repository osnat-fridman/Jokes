/**
 * @jest-environment node
 */
import { JokeError } from "@/lib/domain/errors";
import { isFlagged, requestJoke } from "@/lib/openai/adapter";
import { generateJoke } from "./generateJoke";

jest.mock("@/lib/openai/adapter");

const mockIsFlagged = jest.mocked(isFlagged);
const mockRequestJoke = jest.mocked(requestJoke);

async function codeOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return (error as JokeError).code;
  }
  return "no error";
}

const retriable = () => new JokeError("AI_UNAVAILABLE", { autoRetry: true });
const inSeconds = (s: number) => Date.now() + s * 1000;

beforeEach(() => {
  jest.resetAllMocks();
  mockIsFlagged.mockResolvedValue(false);
  mockRequestJoke.mockResolvedValue({ status: "ok", joke: "  בדיחה  " });
});

describe("generateJoke", () => {
  it("returns a trimmed joke after checking the topic and the joke", async () => {
    await expect(generateJoke(" חתולים ")).resolves.toBe("בדיחה");
    expect(mockIsFlagged).toHaveBeenNthCalledWith(1, "חתולים", 5000);
    expect(mockRequestJoke).toHaveBeenCalledWith("חתולים", 10000);
    expect(mockIsFlagged).toHaveBeenNthCalledWith(2, "בדיחה", 5000);
  });

  it("skips topic moderation for an empty topic", async () => {
    await expect(generateJoke("   ")).resolves.toBe("בדיחה");
    expect(mockRequestJoke).toHaveBeenCalledWith("", 10000);
    expect(mockIsFlagged).toHaveBeenCalledTimes(1);
  });

  it("rejects a long topic before any AI call", async () => {
    expect(await codeOf(generateJoke("א".repeat(51)))).toBe("TOPIC_TOO_LONG");
    expect(mockIsFlagged).not.toHaveBeenCalled();
    expect(mockRequestJoke).not.toHaveBeenCalled();
  });

  it("does not generate a joke when the topic is flagged", async () => {
    mockIsFlagged.mockResolvedValueOnce(true);
    expect(await codeOf(generateJoke("נושא"))).toBe("UNSAFE_TOPIC");
    expect(mockRequestJoke).not.toHaveBeenCalled();
  });

  it("maps a model refusal to UNSAFE_TOPIC", async () => {
    mockRequestJoke.mockResolvedValue({ status: "unsuitable", joke: "" });
    expect(await codeOf(generateJoke("בחירות"))).toBe("UNSAFE_TOPIC");
  });

  it("rejects an empty joke", async () => {
    mockRequestJoke.mockResolvedValue({ status: "ok", joke: "  " });
    expect(await codeOf(generateJoke("ים"))).toBe("INVALID_AI_RESPONSE");
  });

  it("blocks a flagged joke", async () => {
    mockIsFlagged.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    expect(await codeOf(generateJoke("ים"))).toBe("UNSAFE_OUTPUT");
  });
});

describe("generateJoke time budget", () => {
  it("never gives a step more time than is left", async () => {
    await generateJoke("ים", inSeconds(3));
    const timeout = mockIsFlagged.mock.calls[0][1];
    expect(timeout).toBeGreaterThan(2000);
    expect(timeout).toBeLessThanOrEqual(3000);
  });

  it("fails with AI_UNAVAILABLE when no time is left", async () => {
    expect(await codeOf(generateJoke("ים", Date.now() - 1))).toBe("AI_UNAVAILABLE");
    expect(mockIsFlagged).not.toHaveBeenCalled();
  });
});

describe("generateJoke automatic retry", () => {
  it("retries a connection failure or 5xx once", async () => {
    mockRequestJoke
      .mockRejectedValueOnce(retriable())
      .mockResolvedValueOnce({ status: "ok", joke: "שנייה" });
    await expect(generateJoke("ים")).resolves.toBe("שנייה");
    expect(mockRequestJoke).toHaveBeenCalledTimes(2);
  });

  it("gives up after the single retry", async () => {
    mockRequestJoke.mockRejectedValue(retriable());
    expect(await codeOf(generateJoke("ים"))).toBe("AI_UNAVAILABLE");
    expect(mockRequestJoke).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["a 429", new JokeError("AI_RATE_LIMITED")],
    ["a timeout", new JokeError("AI_UNAVAILABLE")],
    ["an invalid response", new JokeError("INVALID_AI_RESPONSE")],
  ])("does not retry %s", async (_, error) => {
    mockRequestJoke.mockRejectedValue(error);
    expect(await codeOf(generateJoke("ים"))).toBe(error.code);
    expect(mockRequestJoke).toHaveBeenCalledTimes(1);
  });

  it("does not retry with less than 12 seconds left", async () => {
    mockRequestJoke.mockRejectedValue(retriable());
    expect(await codeOf(generateJoke("ים", inSeconds(11)))).toBe("AI_UNAVAILABLE");
    expect(mockRequestJoke).toHaveBeenCalledTimes(1);
  });

  it("does not retry moderation", async () => {
    mockIsFlagged.mockRejectedValue(retriable());
    expect(await codeOf(generateJoke("ים"))).toBe("AI_UNAVAILABLE");
    expect(mockIsFlagged).toHaveBeenCalledTimes(1);
    expect(mockRequestJoke).not.toHaveBeenCalled();
  });
});
