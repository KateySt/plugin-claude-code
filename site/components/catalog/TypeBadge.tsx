import { Badge } from "@/components/ui/badge";
import type { ArtifactType } from "@/lib/catalog/types";
import { t, type MessageKey } from "@/lib/i18n";

const TYPE_LABEL: Record<ArtifactType, MessageKey> = {
  plugin: "catalog.badge.plugin",
  skill: "catalog.badge.skill",
  agent: "catalog.badge.agent",
  command: "catalog.badge.command",
  hook: "catalog.badge.hook",
  mcp: "catalog.badge.mcp",
};

interface TypeBadgeProps {
  type: ArtifactType;
  referenceOnly?: boolean;
  manualOnly?: boolean;
}

export function TypeBadge({ type, referenceOnly, manualOnly }: TypeBadgeProps) {
  return (
    <span className="inline-flex gap-1">
      <Badge variant="secondary">{t(TYPE_LABEL[type])}</Badge>
      {referenceOnly ? <Badge variant="outline">{t("catalog.badge.reference")}</Badge> : null}
      {manualOnly ? <Badge variant="outline">{t("catalog.badge.manual")}</Badge> : null}
    </span>
  );
}
