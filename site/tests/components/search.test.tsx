import path from "node:path";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BundleProvider } from "@/components/bundle/BundleProvider";
import { SearchPage } from "@/components/search/SearchPage";
import { bundleSourceFrom } from "@/lib/bundle/settings";
import { loadCatalog } from "@/lib/catalog/load";
import { t } from "@/lib/i18n";
import { toSearchDocs } from "@/lib/search/index-docs";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
  usePathname: () => "/",
}));

const catalog = loadCatalog(path.resolve(__dirname, "../../.."));
const docs = toSearchDocs(catalog);
const plugins = catalog.plugins.map((p) => p.name);
const fetchMock = vi.fn();

function renderSearch() {
  return render(
    <BundleProvider source={bundleSourceFrom(catalog)}>
      <SearchPage
        plugins={plugins}
        repo={catalog.marketplace.repo}
        marketplaceName={catalog.marketplace.name}
      />
    </BundleProvider>,
  );
}

async function ready() {
  await waitFor(() => expect(screen.getAllByTestId("result").length).toBeGreaterThan(0));
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/x");
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => docs });
  vi.stubGlobal("fetch", fetchMock);
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("search page", () => {
  it("fetches the index once from the base path", async () => {
    renderSearch();
    await ready();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/x/search-index.json");
  });

  it("ranks the sdd-engineering plugin first for 'spec driven'", async () => {
    const user = userEvent.setup();
    renderSearch();
    await ready();
    await user.type(screen.getByRole("searchbox"), "spec driven");
    await waitFor(() =>
      expect(screen.getAllByTestId("result")[0]).toHaveTextContent("sdd-engineering"),
    );
  });

  it("combines the agent chip with the plugin filter", async () => {
    const user = userEvent.setup();
    renderSearch();
    await ready();
    await user.click(screen.getByRole("checkbox", { name: "Agent" }));
    await user.selectOptions(screen.getByRole("combobox"), "sdd-engineering");
    await waitFor(() => expect(screen.getAllByTestId("result")).toHaveLength(7));
  });

  it("turns a type word in the query into a type filter", async () => {
    const user = userEvent.setup();
    renderSearch();
    await ready();
    await user.type(screen.getByRole("searchbox"), "I need a skill");
    await waitFor(() => {
      const cards = screen.getAllByTestId("result");
      expect(cards.length).toBeGreaterThan(0);
      for (const card of cards) expect(card).toHaveTextContent(t("catalog.badge.skill"));
    });
  });

  it("shows the empty state and a clear-filters action when filtered", async () => {
    const user = userEvent.setup();
    renderSearch();
    await ready();
    await user.type(screen.getByRole("searchbox"), "zzzqqqxxx");
    expect(await screen.findByText(t("search.noResults", { query: "zzzqqqxxx" }))).toBeInTheDocument();
    expect(screen.queryByText(t("search.clearFilters"))).toBeNull();
    await user.click(screen.getByRole("checkbox", { name: "Skill" }));
    await user.click(await screen.findByRole("button", { name: t("search.clearFilters") }));
    await ready();
  });

  it("writes the query to the URL after the debounce", async () => {
    const user = userEvent.setup();
    renderSearch();
    await ready();
    await user.type(screen.getByRole("searchbox"), "spec driven");
    await waitFor(() => expect(window.location.search).toBe("?q=spec+driven"));
  });

  it("restores state from the URL", async () => {
    window.history.replaceState(null, "", "/?q=spec&type=agent,skill&plugin=sdd-engineering");
    renderSearch();
    await ready();
    expect(screen.getByRole("searchbox")).toHaveValue("spec");
    expect(screen.getByRole("checkbox", { name: "Agent" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Skill" })).toBeChecked();
    expect(screen.getByRole("combobox")).toHaveValue("sdd-engineering");
  });

  it("focuses on '/' and clears on Escape", async () => {
    const user = userEvent.setup();
    renderSearch();
    await ready();
    const box = screen.getByRole("searchbox");
    await user.keyboard("/");
    expect(box).toHaveFocus();
    expect(box).toHaveValue("");
    await user.keyboard("abc");
    expect(box).toHaveValue("abc");
    await user.keyboard("{Escape}");
    expect(box).toHaveValue("");
    await act(async () => {});
  });

  it("copies both CLI lines from a plugin card", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderSearch();
    await ready();
    await user.click(screen.getAllByRole("button", { name: t("install.copyInstall") })[0]);
    expect(writeText).toHaveBeenCalledTimes(1);
    const lines = String(writeText.mock.calls[0][0]).split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(`claude plugin marketplace add ${catalog.marketplace.repo}`);
    expect(lines[1]).toMatch(new RegExp(`^claude plugin install [^@\\s]+@${catalog.marketplace.name}$`));
  });

  it("uses the filtered empty message when only filters are active", async () => {
    window.history.replaceState(null, "", "/?type=hook&plugin=agent-harness");
    renderSearch();
    expect(await screen.findByText(t("search.noResultsFiltered"))).toBeInTheDocument();
    expect(screen.queryByText(/No results for ""/)).toBeNull();
  });

  it("focuses the search box on '/' after a type chip was clicked", async () => {
    const user = userEvent.setup();
    renderSearch();
    await ready();
    const chip = screen.getByRole("checkbox", { name: "Skill" });
    await user.click(chip);
    chip.focus();
    expect(chip).toHaveFocus();
    await user.keyboard("/");
    expect(screen.getByRole("searchbox")).toHaveFocus();
  });
});
