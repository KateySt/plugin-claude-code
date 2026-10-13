import { describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "" }),
  Geist_Mono: () => ({ variable: "" }),
}));

describe("layout metadata", () => {
  it("uses the en.json title and tagline", async () => {
    const { metadata } = await import("@/app/layout");
    expect(metadata.title).toBe(en.site.title);
    expect(metadata.description).toBe(en.site.tagline);
  });
});
