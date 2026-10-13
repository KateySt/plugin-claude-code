import path from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
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
  useSearchParams: () => new URLSearchParams(window.location.search || search),
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
  window.history.replaceState(null, "", "/bundle/");
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
    window.history.replaceState(null, "", "/bundle/?plugins=sdd-engineering,zzz");
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

  it("empty bundle shows the hint and no snippet", async () => {
    const { container } = renderBundle();
    await waitFor(() => expect(screen.getByText(t("bundle.empty"))).toBeInTheDocument());
    expect(container.querySelector("pre")).toBeNull();
  });

  it("an edit after opening a shared URL keeps edits and clears fromUrl", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/bundle/?plugins=sdd-engineering");
    localStorage.setItem(KEY, JSON.stringify(["agent-harness"]));
    renderBundle();
    const saveLabel = t("bundle.save");
    expect(await screen.findByRole("button", { name: saveLabel })).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "agent-harness" }));
    await waitFor(() => expect(window.location.search).toContain("agent-harness"));
    expect(screen.queryByRole("button", { name: saveLabel })).toBeNull();
    expect(screen.getByRole("checkbox", { name: "agent-harness" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "sdd-engineering" })).toBeChecked();
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(["agent-harness", "sdd-engineering"]);
  });

  it("removing the last plugin does not re-read storage", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/bundle/?plugins=sdd-engineering");
    localStorage.setItem(KEY, JSON.stringify(["agent-harness"]));
    renderBundle();
    await user.click(await screen.findByRole("checkbox", { name: "sdd-engineering" }));
    expect(screen.getByRole("checkbox", { name: "agent-harness" })).not.toBeChecked();
    expect(screen.getByText(t("bundle.empty"))).toBeInTheDocument();
  });

  it("save clears fromUrl and writes storage", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/bundle/?plugins=sdd-engineering");
    renderBundle();
    const saveLabel = t("bundle.save");
    await user.click(await screen.findByRole("button", { name: saveLabel }));
    expect(screen.queryByRole("button", { name: saveLabel })).toBeNull();
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(["sdd-engineering"]);
  });

  it("malformed stored JSON gives an empty bundle", async () => {
    localStorage.setItem(KEY, "{not json");
    renderBundle();
    await waitFor(() => expect(screen.getByText(t("bundle.empty"))).toBeInTheDocument());
  });
});
