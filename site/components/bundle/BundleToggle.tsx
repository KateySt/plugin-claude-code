"use client";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useBundle } from "./BundleProvider";

export function BundleToggle({ name }: { name: string }) {
  const { has, toggle } = useBundle();
  const selected = has(name);
  return (
    <Button
      type="button"
      variant={selected ? "secondary" : "outline"}
      size="sm"
      aria-pressed={selected}
      onClick={() => toggle(name)}
    >
      {selected ? t("bundle.remove") : t("bundle.add")}
    </Button>
  );
}
