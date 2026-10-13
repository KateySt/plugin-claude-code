"use client";

import { CopyButton } from "@/components/install/CopyButton";
import { Button } from "@/components/ui/button";
import { bundleCommands, bundleSettings } from "@/lib/bundle/settings";
import { t } from "@/lib/i18n";
import { useBundle } from "./BundleProvider";

export function BundleOutput() {
  const { plugins, source, unknown, fromUrl, save } = useBundle();

  const notice =
    unknown.length > 0 ? (
      <p role="status">{t("bundle.unknown", { names: unknown.join(", ") })}</p>
    ) : null;

  if (plugins.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {notice}
        <p>{t("bundle.empty")}</p>
      </div>
    );
  }

  const settings = JSON.stringify(bundleSettings(plugins, source), null, 2);
  const commands = bundleCommands(plugins, source).join("\n");

  return (
    <div className="flex flex-col gap-4">
      {notice}
      {fromUrl ? (
        <div>
          <Button type="button" onClick={save}>
            {t("bundle.save")}
          </Button>
        </div>
      ) : null}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("bundle.settingsHeading")}</h2>
        <pre data-testid="bundle-settings" className="overflow-x-auto rounded-md border p-3">
          {settings}
        </pre>
        <div>
          <CopyButton text={settings} label="bundle.copySettings" />
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("bundle.commandsHeading")}</h2>
        <pre data-testid="bundle-commands" className="overflow-x-auto rounded-md border p-3">
          {commands}
        </pre>
        <div>
          <CopyButton text={commands} label="bundle.copyCommands" />
        </div>
      </section>
      <p>{t("bundle.trustNote")}</p>
    </div>
  );
}
