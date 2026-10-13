import fs from "node:fs";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import BundlePage, { generateMetadata as bundleMetadata } from "@/app/bundle/page";
import NotFound from "@/app/not-found";
import ArtifactPage, {
  generateMetadata as artifactMetadata,
  generateStaticParams as artifactParams,
} from "@/app/plugins/[plugin]/[type]/[name]/page";
import PluginPage, {
  generateMetadata as pluginMetadata,
  generateStaticParams as pluginParams,
} from "@/app/plugins/[plugin]/page";
import { BundleProvider } from "@/components/bundle/BundleProvider";
import { bundleSourceFrom } from "@/lib/bundle/settings";
import { getCatalog } from "@/lib/catalog";
import { githubBlobUrl, githubTreeUrl } from "@/lib/catalog/urls";
import { t } from "@/lib/i18n";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/plugins/sdd-engineering/",
}));

const catalog = getCatalog();
const root = path.resolve(process.cwd(), "..");

function withBundle(node: ReactNode) {
  return <BundleProvider source={bundleSourceFrom(catalog)}>{node}</BundleProvider>;
}

describe("plugin page", () => {
  it("shows version, rows, dependency, install block and source link", async () => {
    const manifest = JSON.parse(
      fs.readFileSync(
        path.join(root, "plugins/sdd-engineering/.claude-plugin/plugin.json"),
        "utf8",
      ),
    ) as { version: string };
    const plugin = catalog.plugins.find((p) => p.name === "sdd-engineering")!;
    const agents = plugin.artifacts.filter((a) => a.type === "agent").length;
    const skills = plugin.artifacts.filter((a) => a.type === "skill").length;

    render(
      withBundle(await PluginPage({ params: Promise.resolve({ plugin: "sdd-engineering" }) })),
    );

    expect(screen.getByText(t("catalog.version", { version: manifest.version }))).toBeTruthy();
    expect(agents).toBeGreaterThan(0);
    expect(skills).toBeGreaterThan(0);
    expect(within(screen.getByTestId("list-agent")).getAllByRole("listitem")).toHaveLength(agents);
    expect(within(screen.getByTestId("list-skill")).getAllByRole("listitem")).toHaveLength(skills);
    expect(screen.queryByTestId("list-hook")).toBeNull();
    expect(screen.getByText(
        t("artifact.dependencyFrom", { name: "superpowers", marketplace: "claude-plugins-official" }),
      )).toBeTruthy();
    expect(screen.getByTestId("install-cli")).toBeTruthy();
    expect(screen.getByRole("button", { name: t("bundle.add") })).toBeTruthy();
    const source = screen.getByRole("link", { name: t("artifact.viewSource") });
    expect(source.getAttribute("href")).toBe(
      githubTreeUrl(catalog.marketplace.repoUrl, "plugins/sdd-engineering"),
    );
  });

  it("renders exactly one h1 even though the README has its own", async () => {
    render(
      withBundle(await PluginPage({ params: Promise.resolve({ plugin: "sdd-engineering" }) })),
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("builds metadata and static params from the catalog", async () => {
    expect(await pluginParams()).toEqual(catalog.plugins.map((p) => ({ plugin: p.name })));
    const meta = await pluginMetadata({
      params: Promise.resolve({ plugin: "sdd-engineering" }),
    });
    expect(meta.title).toMatch(new RegExp(` · ${catalog.marketplace.name}$`));
  });
});

describe("artifact pages", () => {
  it("marks reference skills without a slash in the title", async () => {
    const artifact = catalog.artifacts.find((a) => a.id === "agent-harness/skill/agents-md-standards")!;
    expect(artifact.referenceOnly).toBe(true);
    render(
      withBundle(
        await ArtifactPage({
          params: Promise.resolve({
            plugin: "agent-harness",
            type: "skill",
            name: "agents-md-standards",
          }),
        }),
      ),
    );
    expect(screen.getByText(t("catalog.badge.reference"))).toBeTruthy();
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe(artifact.title);
    expect(heading.textContent?.startsWith("/")).toBe(false);
    expect(screen.getByText(t("artifact.referenceNote"))).toBeTruthy();
    expect(
      screen.getByRole("link", { name: t("artifact.viewSource") }).getAttribute("href"),
    ).toBe(githubBlobUrl(catalog.marketplace.repoUrl, artifact.sourcePath));
    expect(screen.getByTestId("install-cli")).toBeTruthy();
  });

  it("shows agent tools metadata", async () => {
    const artifact = catalog.artifacts.find((a) => a.id === "sdd-engineering/agent/test-writer")!;
    expect(artifact.meta.tools).toBeTruthy();
    render(
      withBundle(
        await ArtifactPage({
          params: Promise.resolve({
            plugin: "sdd-engineering",
            type: "agent",
            name: "test-writer",
          }),
        }),
      ),
    );
    expect(screen.getByText(artifact.meta.tools)).toBeTruthy();
    expect(
      (await artifactMetadata({
        params: Promise.resolve({ plugin: "sdd-engineering", type: "agent", name: "test-writer" }),
      })).description,
    ).toBe(artifact.description);
  });

  it("generates params for skills, agents and commands only", async () => {
    const params = await artifactParams();
    const expected = catalog.artifacts.filter((a) =>
      ["skill", "agent", "command"].includes(a.type),
    );
    expect(params).toHaveLength(expected.length);
    expect(params.some((p) => ["hook", "mcp", "plugin"].includes(p.type))).toBe(false);
  });
});

describe("not found", () => {
  it("links home", () => {
    render(<NotFound />);
    expect(screen.getByText(t("notFound.title"))).toBeTruthy();
    expect(screen.getByRole("link", { name: t("notFound.backHome") }).getAttribute("href")).toBe("/");
  });
});

describe("bundle page", () => {
  it("links back to the catalog and shows the footer", () => {
    render(withBundle(<BundlePage />));
    expect(
      screen.getByRole("link", { name: t("artifact.backToCatalog") }).getAttribute("href"),
    ).toBe("/");
    expect(screen.getByRole("contentinfo")).toBeTruthy();
  });

  it("titles the page with the marketplace suffix", () => {
    expect(bundleMetadata().title).toBe(
      t("catalog.pageTitle", {
        title: t("bundle.pageTitle"),
        marketplace: catalog.marketplace.name,
      }),
    );
  });
});
