import { describe, expect, it } from "vitest";
import { installCommands } from "@/lib/install/commands";

describe("installCommands", () => {
  it("returns the two CLI lines and the two in-session lines", () => {
    expect(installCommands("KateySt/plugin-claude-code", "kateyst-plugins", "sdd-engineering")).toEqual({
      cli: [
        "claude plugin marketplace add KateySt/plugin-claude-code",
        "claude plugin install sdd-engineering@kateyst-plugins",
      ],
      session: [
        "/plugin marketplace add KateySt/plugin-claude-code",
        "/plugin install sdd-engineering@kateyst-plugins",
      ],
    });
  });
});
