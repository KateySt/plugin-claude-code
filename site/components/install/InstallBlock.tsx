"use client";

import { CopyButton } from "@/components/install/CopyButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { t } from "@/lib/i18n";
import { installCommands } from "@/lib/install/commands";

interface InstallBlockProps {
  repo: string;
  marketplaceName: string;
  plugin: string;
}

function CommandPanel({ id, text }: { id: string; text: string }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg bg-muted p-3">
      <pre data-testid={id} className="overflow-x-auto font-mono text-sm">
        {text}
      </pre>
      <CopyButton text={text} label="install.copy" />
    </div>
  );
}

export function InstallBlock({ repo, marketplaceName, plugin }: InstallBlockProps) {
  const commands = installCommands(repo, marketplaceName, plugin);
  const cli = commands.cli.join("\n");
  const session = commands.session.join("\n");

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{t("install.heading")}</h2>
      <Tabs defaultValue="cli">
        <TabsList>
          <TabsTrigger value="cli">{t("install.tabCli")}</TabsTrigger>
          <TabsTrigger value="session">{t("install.tabSession")}</TabsTrigger>
        </TabsList>
        <TabsContent value="cli">
          <CommandPanel id="install-cli" text={cli} />
        </TabsContent>
        <TabsContent value="session">
          <CommandPanel id="install-session" text={session} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
