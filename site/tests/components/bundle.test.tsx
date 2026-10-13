import path from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BundleChecklist } from "@/components/bundle/BundleChecklist";
import { BundleOutput } from "@/components/bundle/BundleOutput";
import { BundleProvider, useBundle } from "@/components/bundle/BundleProvider";
import { bundleSourceFrom } from "@/lib/bundle/settings";
import { loadCatalog } from "@/lib/catalog/load";
import { t } from "@/lib/i18n";

let search = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search),
  usePathname: () => "/bundle/",
}));

const source = bundleSourceFrom(loadCatalog(path.resolve(__dirname, "../../..")));
const KEY = "kateyst-plugins:bundle";

function SaveButton() {
  const { save } = useBundle();
  return (
    <button type="button" onClick={save}>
      save-now
    </button>
  );
}

function renderBundle() {
  return render(
    <BundleProvider source={source}>
      <BundleChecklist />
      <BundleOutput />
      <SaveButton />
    </BundleProvider>,
  );
}

beforeEach(() => {
  search = "";
  localStorage.clear();
  window.history.replaceState(null, "", "/bundle/");
});

describe("bundle", () => {
  it("toggling a plugin shows settings JSON and writes storage", async () => {
    const user = userEvent.setup();
    renderBundle();
    await user.click(screen.getByRole("checkbox", { name: "agent-harness" }));
    expect(screen.getByTestId("bundle-settings").textContent).toContain(
      '"agent-harness@kateyst-plugins": true',
    );
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(["agent-harness"]);
    expect(window.location.search).toBe("?plugins=agent-harness");
  });

  it("URL wins, notices unknown names, and does not overwrite storage until save", async () => {
    const user = userEvent.setup();
    search = "plugins=sdd-engineering,zzz";
    localStorage.setItem(KEY, JSON.stringify(["agent-harness"]));
    renderBundle();
    const settings = await screen.findByTestId("bundle-settings");
    expect(settings.textContent).toContain("sdd-engineering@kateyst-plugins");
    expect(settings.textContent).toContain("superpowers@");
    expect(screen.getByText(/zzz/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(["agent-harness"]);
    await user.click(screen.getByRole("button", { name: "save-now" }));
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(["sdd-engineering"]);
  });

  it("uses the saved bundle when there is no URL param", async () => {
    localStorage.setItem(KEY, JSON.stringify(["agent-harness"]));
    renderBundle();
    expect(await screen.findByTestId("bundle-settings")).toBeInTheDocument();
  });

  it("empty bundle shows the hint and no snippet", () => {
    const { container } = renderBundle();
    expect(screen.getByText(t("bundle.empty"))).toBeInTheDocument();
    expect(container.querySelector("pre")).toBeNull();
  });
});
