export interface InstallCommands {
  cli: string[];
  session: string[];
}

/** The one-plugin install text: add the marketplace, then install the plugin. */
export function installCommands(
  repo: string,
  marketplaceName: string,
  plugin: string,
): InstallCommands {
  return {
    cli: [
      `claude plugin marketplace add ${repo}`,
      `claude plugin install ${plugin}@${marketplaceName}`,
    ],
    session: [`/plugin marketplace add ${repo}`, `/plugin install ${plugin}@${marketplaceName}`],
  };
}
