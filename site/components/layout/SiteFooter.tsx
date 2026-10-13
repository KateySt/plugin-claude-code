import Link from "next/link";
import { t } from "@/lib/i18n";

export function SiteFooter({ repoUrl }: { repoUrl: string }) {
  return (
    <footer className="mt-8 flex gap-4 border-t pt-4 text-sm text-muted-foreground">
      <Link href="/bundle/" className="underline">
        {t("bundle.pageTitle")}
      </Link>
      <a href={repoUrl} className="underline" rel="noreferrer">
        {t("site.github")}
      </a>
    </footer>
  );
}
