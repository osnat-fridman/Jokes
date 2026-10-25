import { BROWSER_TIMEOUT_MS, requestJoke } from "./requestJoke";

// jsdom has no Response class, so a minimal stand-in is enough for the client.
function reply(status: number, json: () => Promise<unknown>) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json } as Response);
}

const fetchMock = jest.fn();
let onLine: jest.SpyInstance;

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  onLine = jest.spyOn(navigator, "onLine", "get").mockReturnValue(true);
});

afterEach(() => {
  onLine.mockRestore();
  jest.useRealTimers();
});

describe("requestJoke (browser)", () => {
  it("returns NETWORK_ERROR offline without sending anything", async () => {
    onLine.mockReturnValue(false);
    expect(await requestJoke("ים")).toEqual({ ok: false, code: "NETWORK_ERROR" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns NETWORK_ERROR when the request cannot reach the server", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await requestJoke("ים")).toEqual({ ok: false, code: "NETWORK_ERROR" });
  });

  it("gives up after 32 seconds as AI_UNAVAILABLE", async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) =>
          init.signal!.addEventListener("abort", () => reject(new DOMException("aborted"))),
        ),
    );
    const pending = requestJoke("ים");
    jest.advanceTimersByTime(BROWSER_TIMEOUT_MS - 1);
    await Promise.resolve();
    jest.advanceTimersByTime(1);
    expect(await pending).toEqual({ ok: false, code: "AI_UNAVAILABLE" });
    expect(BROWSER_TIMEOUT_MS).toBe(32_000);
  });

  it.each([
    [429, "AI_RATE_LIMITED"],
    [403, "AI_RATE_LIMITED"],
    [500, "INTERNAL_ERROR"],
    [502, "INTERNAL_ERROR"],
  ])("maps a %i reply that is not in the app format to %s", async (status, code) => {
    fetchMock.mockReturnValue(reply(status, async () => { throw new SyntaxError("html"); }));
    expect(await requestJoke("ים")).toEqual({ ok: false, code });
  });

  it("treats any 429 as AI_RATE_LIMITED", async () => {
    fetchMock.mockReturnValue(reply(429, async () => ({ something: "else" })));
    expect(await requestJoke("ים")).toEqual({ ok: false, code: "AI_RATE_LIMITED" });
  });

  it("uses the code from an app error", async () => {
    const body = { error: { code: "UNSAFE_OUTPUT", message: "x", retryable: true } };
    fetchMock.mockReturnValue(reply(422, async () => body));
    expect(await requestJoke("ים")).toEqual({ ok: false, code: "UNSAFE_OUTPUT" });
  });

  it("returns the joke on success", async () => {
    fetchMock.mockReturnValue(reply(200, async () => ({ joke: "בדיחה" })));
    expect(await requestJoke("ים")).toEqual({ ok: true, joke: "בדיחה" });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", cache: "no-store" });
  });
});
