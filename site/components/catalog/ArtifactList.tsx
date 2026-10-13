import { ArtifactCard } from "@/components/catalog/ArtifactCard";
import { TypeBadge } from "@/components/catalog/TypeBadge";
import type { Artifact, ArtifactType } from "@/lib/catalog/types";
import { t } from "@/lib/i18n";

interface ArtifactListProps {
  type: ArtifactType;
  heading: string;
  artifacts: Artifact[];
}

export function ArtifactList({ type, heading, artifacts }: ArtifactListProps) {
  if (artifacts.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{heading}</h2>
      <ul data-testid={`list-${type}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {artifacts.map((a) => (
          <li key={a.id}>
            <ArtifactCard className="h-full">
              <ArtifactCard.Header>
                <ArtifactCard.Title href={a.url}>{a.title}</ArtifactCard.Title>
                <ArtifactCard.Meta>
                  <TypeBadge
                    type={a.type}
                    referenceOnly={a.referenceOnly}
                    manualOnly={a.manualOnly}
                  />
                </ArtifactCard.Meta>
              </ArtifactCard.Header>
              {a.description ? (
                <ArtifactCard.Description>{a.description}</ArtifactCard.Description>
              ) : null}
            </ArtifactCard>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const ARTIFACT_LIST_SECTIONS: { type: ArtifactType; heading: ReturnType<typeof t> }[] = [
  { type: "skill", heading: t("catalog.skills") },
  { type: "agent", heading: t("catalog.agents") },
  { type: "command", heading: t("catalog.commands") },
  { type: "hook", heading: t("catalog.hooks") },
  { type: "mcp", heading: t("catalog.mcps") },
];
