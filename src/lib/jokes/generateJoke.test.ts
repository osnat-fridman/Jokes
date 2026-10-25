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

beforeEach(() => {
  jest.resetAllMocks();
  mockIsFlagged.mockResolvedValue(false);
  mockRequestJoke.mockResolvedValue({ status: "ok", joke: "  בדיחה  " });
});

describe("generateJoke", () => {
  it("returns a trimmed joke after checking the topic and the joke", async () => {
    await expect(generateJoke(" חתולים ")).resolves.toBe("בדיחה");
    expect(mockIsFlagged).toHaveBeenNthCalledWith(1, "חתולים");
    expect(mockRequestJoke).toHaveBeenCalledWith("חתולים");
    expect(mockIsFlagged).toHaveBeenNthCalledWith(2, "בדיחה");
  });

  it("skips topic moderation for an empty topic", async () => {
    await expect(generateJoke("   ")).resolves.toBe("בדיחה");
    expect(mockRequestJoke).toHaveBeenCalledWith("");
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
