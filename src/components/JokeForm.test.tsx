import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JokeForm from "./JokeForm";

describe("JokeForm", () => {
  it("has accessible names for the field and the button", () => {
    render(<JokeForm />);
    expect(screen.getByRole("textbox", { name: "נושא לבדיחה" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "צרו לי בדיחה" })).toBeInTheDocument();
  });

  it("starts with an empty field and a 0/50 counter", () => {
    render(<JokeForm />);
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByText("0/50")).toBeInTheDocument();
  });

  it("updates the counter while typing", async () => {
    const user = userEvent.setup();
    render(<JokeForm />);
    await user.type(screen.getByRole("textbox"), "חתולים");
    expect(screen.getByText("6/50")).toBeInTheDocument();
  });

  it("cuts pasted text to 50 characters", async () => {
    const user = userEvent.setup();
    render(<JokeForm />);
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.paste("ב".repeat(60));
    expect(input).toHaveValue("ב".repeat(50));
    expect(screen.getByText("50/50")).toBeInTheDocument();
  });

  it("does not accept typing beyond 50 characters", async () => {
    const user = userEvent.setup();
    render(<JokeForm />);
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.paste("ג".repeat(50));
    await user.type(input, "דד");
    expect(input).toHaveValue("ג".repeat(50));
  });

  it("keeps the screen unchanged when the button is pressed", async () => {
    const user = userEvent.setup();
    render(<JokeForm />);
    await user.type(screen.getByRole("textbox"), "ים");
    await user.click(screen.getByRole("button", { name: "צרו לי בדיחה" }));
    expect(screen.getByRole("textbox")).toHaveValue("ים");
  });
});
