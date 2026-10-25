import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JokeApp from "./JokeApp";

const GENERIC = "משהו השתבש אצלנו. נסו שוב בעוד רגע.";
const UNSAFE = "על הנושא הזה לא נוכל לכתוב בדיחה. נסו נושא אחר.";
const TOO_LONG = "הנושא ארוך מדי. נסו עד 50 תווים.";
const BLOCKED_JOKE = "לא הצלחנו ליצור בדיחה מתאימה הפעם.";
const OFFLINE = "אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.";
const INVALID = "משהו השתבש. רעננו את הדף ונסו שוב.";

// jsdom has no Response class, so a minimal stand-in is enough for the client.
function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

function errorBody(code: string, retryable = true) {
  return { error: { code, message: "server text", retryable } };
}

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
});

function setup() {
  const user = userEvent.setup();
  render(<JokeApp />);
  return {
    user,
    input: screen.getByRole("textbox", { name: "נושא לבדיחה" }),
    button: screen.getByRole("button", { name: "צרו לי בדיחה" }),
  };
}

function sentTopic(call = 0) {
  return JSON.parse(fetchMock.mock.calls[call][1].body).topic;
}

describe("JokeApp", () => {
  it("shows the joke for the typed topic", async () => {
    fetchMock.mockReturnValue(jsonResponse({ joke: "בדיחה על חתולים" }));
    const { user, input, button } = setup();
    await user.type(input, "חתולים");
    await user.click(button);
    expect(await screen.findByText("בדיחה על חתולים")).toBeInTheDocument();
    expect(sentTopic()).toBe("חתולים");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/jokes");
  });

  it("sends an empty topic for a general joke", async () => {
    fetchMock.mockReturnValue(jsonResponse({ joke: "בדיחה כללית" }));
    const { user, button } = setup();
    await user.click(button);
    expect(await screen.findByText("בדיחה כללית")).toBeInTheDocument();
    expect(sentTopic()).toBe("");
  });

  it("shows loading feedback and sends only one request while loading", async () => {
    let resolve!: (r: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    const { user, input, button } = setup();

    await user.type(input, "ים");
    await user.click(button);
    expect(screen.getByText("רגע, הבדיחה בדרך...")).toBeInTheDocument();
    expect(button).toBeDisabled();

    await user.click(button);
    await user.type(input, "{Enter}");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => resolve(await jsonResponse({ joke: "בדיחה על הים" })));
    expect(await screen.findByText("בדיחה על הים")).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it("creates a new joke after changing the topic", async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse({ joke: "ראשונה" }))
      .mockReturnValueOnce(jsonResponse({ joke: "שנייה" }));
    const { user, input, button } = setup();
    await user.type(input, "ים");
    await user.click(button);
    await screen.findByText("ראשונה");

    await user.clear(input);
    await user.type(input, "חתולים");
    await user.click(button);
    expect(await screen.findByText("שנייה")).toBeInTheDocument();
    expect(screen.queryByText("ראשונה")).not.toBeInTheDocument();
    expect(sentTopic(1)).toBe("חתולים");
  });

  it("shows an unsafe topic under the field and keeps the previous joke", async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse({ joke: "בדיחה קודמת" }))
      .mockReturnValueOnce(jsonResponse(errorBody("UNSAFE_TOPIC", false), 422));
    const { user, input, button } = setup();
    await user.click(button);
    await screen.findByText("בדיחה קודמת");

    await user.type(input, "נושא");
    await user.click(button);
    expect(await screen.findByText(UNSAFE)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(expect.stringContaining(UNSAFE));
    expect(screen.getByText("בדיחה קודמת")).toBeInTheDocument();

    await user.type(input, "א");
    expect(screen.queryByText(UNSAFE)).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("shows a too-long topic from the server under the field, without retry", async () => {
    fetchMock.mockReturnValue(jsonResponse(errorBody("TOPIC_TOO_LONG", false), 400));
    const { user, input, button } = setup();
    await user.type(input, "ים");
    await user.click(button);
    expect(await screen.findByText(TOO_LONG)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("כאן תופיע הבדיחה שלכם")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "נסו שוב" })).not.toBeInTheDocument();
  });

  it.each([
    ["UNSAFE_OUTPUT", () => jsonResponse(errorBody("UNSAFE_OUTPUT"), 422), BLOCKED_JOKE],
    ["AI_RATE_LIMITED", () => jsonResponse(errorBody("AI_RATE_LIMITED"), 429), GENERIC],
    ["INVALID_AI_RESPONSE", () => jsonResponse(errorBody("INVALID_AI_RESPONSE"), 502), GENERIC],
    ["AI_UNAVAILABLE", () => jsonResponse(errorBody("AI_UNAVAILABLE"), 503), GENERIC],
    ["INTERNAL_ERROR", () => jsonResponse(errorBody("INTERNAL_ERROR"), 500), GENERIC],
    ["NETWORK_ERROR", () => Promise.reject(new TypeError("Failed to fetch")), OFFLINE],
    ["an unexpected body", () => jsonResponse({ nope: true }), GENERIC],
    ["a firewall 403", () => jsonResponse("Forbidden", 403), GENERIC],
  ])("shows the %s message in the card with a retry button", async (_, reply, message) => {
    fetchMock.mockImplementation(reply);
    const { user, button } = setup();
    await user.click(button);
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "נסו שוב" })).toBeInTheDocument();
  });

  it("shows INVALID_REQUEST in the card without a retry button", async () => {
    fetchMock.mockReturnValue(jsonResponse(errorBody("INVALID_REQUEST", false), 400));
    const { user, button } = setup();
    await user.click(button);
    expect(await screen.findByText(INVALID)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "נסו שוב" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("chooses the message by code, not by the server text", async () => {
    fetchMock.mockReturnValue(jsonResponse(errorBody("AI_UNAVAILABLE"), 503));
    const { user, button } = setup();
    await user.click(button);
    await screen.findByText(GENERIC);
    expect(screen.queryByText("server text")).not.toBeInTheDocument();
  });

  it("retries once with the topic currently in the field", async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse(errorBody("AI_UNAVAILABLE"), 503))
      .mockReturnValueOnce(jsonResponse({ joke: "הצליח" }));
    const { user, input, button } = setup();
    await user.type(input, "ים");
    await user.click(button);
    const retry = await screen.findByRole("button", { name: "נסו שוב" });

    await user.type(input, "!");
    await user.click(retry);
    expect(await screen.findByText("הצליח")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sentTopic(1)).toBe("ים!");
    expect(screen.queryByRole("button", { name: "נסו שוב" })).not.toBeInTheDocument();
  });

  it("sends a single request for a fast double click on retry", async () => {
    let resolve!: (r: Response) => void;
    fetchMock
      .mockReturnValueOnce(jsonResponse(errorBody("AI_UNAVAILABLE"), 503))
      .mockReturnValueOnce(new Promise<Response>((r) => (resolve = r)));
    const { user, button } = setup();
    await user.click(button);
    const retry = await screen.findByRole("button", { name: "נסו שוב" });

    await user.dblClick(retry);
    await user.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => resolve(await jsonResponse({ joke: "אחת" })));
    expect(await screen.findByText("אחת")).toBeInTheDocument();
  });

  it("stores nothing in the browser", async () => {
    fetchMock.mockReturnValue(jsonResponse({ joke: "בדיחה" }));
    const { user, input, button } = setup();
    await user.type(input, "ים");
    await user.click(button);
    await screen.findByText("בדיחה");
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).toBe("");
  });
});
