import { t } from "@/lib/i18n";

interface SiteHeaderProps {
  name: string;
  description: string;
  repoUrl: string;
}

export function SiteHeader({ name, description, repoUrl }: SiteHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{name}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <a href={repoUrl} className="text-sm underline" rel="noreferrer">
        {t("site.github")}
      </a>
    </header>
  );
}
