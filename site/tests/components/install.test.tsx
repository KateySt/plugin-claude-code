import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "@/components/install/CopyButton";
import { InstallBlock } from "@/components/install/InstallBlock";

const CLI = [
  "claude plugin marketplace add KateySt/plugin-claude-code",
  "claude plugin install sdd-engineering@kateyst-plugins",
].join("\n");

describe("InstallBlock", () => {
  it("renders the two CLI lines", () => {
    render(
      <InstallBlock
        repo="KateySt/plugin-claude-code"
        marketplaceName="kateyst-plugins"
        plugin="sdd-engineering"
      />,
    );
    const pre = screen.getByTestId("install-cli");
    expect(pre.textContent).toBe(CLI);
  });

  it("shows the in-session lines on the second tab", async () => {
    const user = userEvent.setup();
    render(
      <InstallBlock
        repo="KateySt/plugin-claude-code"
        marketplaceName="kateyst-plugins"
        plugin="sdd-engineering"
      />,
    );
    await user.click(screen.getByRole("tab", { name: "In session" }));
    expect(screen.getByTestId("install-session").textContent).toBe(
      [
        "/plugin marketplace add KateySt/plugin-claude-code",
        "/plugin install sdd-engineering@kateyst-plugins",
      ].join("\n"),
    );
  });
});

describe("CopyButton", () => {
  let writeText: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
  });
  afterEach(() => vi.useRealTimers());

  it("writes the text and shows the copied label", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<CopyButton text={CLI} label="install.copy" />);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith(CLI);
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });
});
