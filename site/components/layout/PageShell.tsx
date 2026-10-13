import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getCatalog } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: ReactNode;
  /** Tailwind max-width class for the content column. */
  width?: string;
  /** Show the back-to-catalog link; the home page turns it off. */
  back?: boolean;
}

export function PageShell({ children, width = "max-w-4xl", back = true }: PageShellProps) {
  const { marketplace } = getCatalog();
  return (
    <main className={cn("mx-auto flex w-full flex-col gap-6 p-6", width)}>
      {back ? (
        <Link href="/" className="text-sm underline">
          {t("artifact.backToCatalog")}
        </Link>
      ) : null}
      {children}
      <SiteFooter repoUrl={marketplace.repoUrl} />
    </main>
  );
}
