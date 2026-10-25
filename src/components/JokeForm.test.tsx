import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JokeForm from "./JokeForm";

function Harness({
  onSubmit = () => {},
  loading = false,
  errorMessage,
}: {
  onSubmit?: () => void;
  loading?: boolean;
  errorMessage?: string;
}) {
  const [topic, setTopic] = useState("");
  return (
    <JokeForm
      topic={topic}
      onTopicChange={setTopic}
      onSubmit={onSubmit}
      loading={loading}
      errorMessage={errorMessage}
    />
  );
}

describe("JokeForm", () => {
  it("has accessible names for the field and the button", () => {
    render(<Harness />);
    expect(screen.getByRole("textbox", { name: "נושא לבדיחה" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "צרו לי בדיחה" })).toBeInTheDocument();
  });

  it("starts with an empty field and a 0/50 counter", () => {
    render(<Harness />);
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByText("0/50")).toBeInTheDocument();
  });

  it("updates the counter while typing", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByRole("textbox"), "חתולים");
    expect(screen.getByText("6/50")).toBeInTheDocument();
  });

  it("cuts pasted text to 50 characters", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.paste("ב".repeat(60));
    expect(input).toHaveValue("ב".repeat(50));
    expect(screen.getByText("50/50")).toBeInTheDocument();
  });

  it("does not accept typing beyond 50 characters", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.paste("ג".repeat(50));
    await user.type(input, "דד");
    expect(input).toHaveValue("ג".repeat(50));
  });

  it("submits with the button and with Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<Harness onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button"));
    await user.type(screen.getByRole("textbox"), "ים{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it("disables the button while loading", () => {
    render(<Harness loading />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("links an error message to the field", () => {
    render(<Harness errorMessage="שגיאה" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(expect.stringContaining("שגיאה"));
  });
});
