import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { t } from "@/lib/i18n";

export default function NotFound() {
  return (
    <PageShell width="max-w-2xl" back={false}>
      <h1 className="text-2xl font-semibold">{t("notFound.title")}</h1>
      <p className="text-muted-foreground">{t("notFound.body")}</p>
      <Link href="/" className="underline">
        {t("notFound.backHome")}
      </Link>
    </PageShell>
  );
}
