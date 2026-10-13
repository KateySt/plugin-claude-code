import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArtifactCard } from "@/components/catalog/ArtifactCard";
import { TypeBadge } from "@/components/catalog/TypeBadge";
import { VersionBadge } from "@/components/catalog/VersionBadge";

describe("TypeBadge", () => {
  it("shows the type label", () => {
    render(<TypeBadge type="skill" />);
    expect(screen.getByText("Skill")).toBeInTheDocument();
  });

  it("shows the reference label when referenceOnly", () => {
    render(<TypeBadge type="skill" referenceOnly />);
    expect(screen.getByText("Reference")).toBeInTheDocument();
  });

  it("shows the manual label when manualOnly", () => {
    render(<TypeBadge type="skill" manualOnly />);
    expect(screen.getByText("Manual")).toBeInTheDocument();
  });
});

describe("VersionBadge", () => {
  it("renders the version", () => {
    render(<VersionBadge version="1.2.3" />);
    expect(screen.getByText("Version 1.2.3")).toBeInTheDocument();
  });
});

describe("ArtifactCard", () => {
  it("composes its parts", () => {
    render(
      <ArtifactCard>
        <ArtifactCard.Header>
          <ArtifactCard.Title href="/plugins/p/">p</ArtifactCard.Title>
          <ArtifactCard.Meta>meta</ArtifactCard.Meta>
        </ArtifactCard.Header>
        <ArtifactCard.Description>desc</ArtifactCard.Description>
        <ArtifactCard.Actions>act</ArtifactCard.Actions>
      </ArtifactCard>,
    );
    expect(screen.getByRole("link", { name: "p" })).toHaveAttribute("href", "/plugins/p");
    expect(screen.getByText("meta")).toBeInTheDocument();
    expect(screen.getByText("desc")).toBeInTheDocument();
    expect(screen.getByText("act")).toBeInTheDocument();
  });
});
