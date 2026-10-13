import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";

export function VersionBadge({ version }: { version: string }) {
  return <Badge variant="outline">{t("catalog.version", { version })}</Badge>;
}
