import { t, type MessageKey } from "@/lib/i18n";

const META_LABEL: Record<string, MessageKey> = {
  "argument-hint": "artifact.argumentHint",
  tools: "artifact.tools",
  model: "artifact.model",
};

export function ArtifactMeta({ meta }: { meta: Record<string, string> }) {
  const entries = Object.entries(meta).filter(([key]) => key in META_LABEL);
  if (entries.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{t("artifact.metadata")}</h2>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
        {entries.map(([key, value]) => (
          <div key={key} className="contents">
            <dt className="text-muted-foreground">{t(META_LABEL[key])}</dt>
            <dd className="font-mono">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
