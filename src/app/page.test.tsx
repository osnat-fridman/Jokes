import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

describe("Home screen", () => {
  it("shows every element of the approved design", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "רגע של צחוק" })).toBeInTheDocument();
    expect(screen.getByLabelText("נושא לבדיחה")).toBeInTheDocument();
    expect(screen.getByText("0/50")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "צרו לי בדיחה" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "הבדיחה שלכם" })).toBeInTheDocument();
    expect(screen.getByText("כאן תופיע הבדיחה שלכם")).toBeInTheDocument();
  });

  it("hides decorative images from screen readers", () => {
    const { container } = render(<Home />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector('img[src="/raccoon.webp"]')).toHaveAttribute("alt", "");
  });

  it("has only the field and the button as interactive elements, in that tab order", async () => {
    const user = userEvent.setup();
    render(<Home />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole("textbox", { name: "נושא לבדיחה" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "צרו לי בדיחה" })).toHaveFocus();
  });
});
