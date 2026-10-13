import type { ArtifactType } from "@/lib/catalog/types";

/** Conversational filler dropped from queries ("I need a skill for ..."). */
export const STOPWORDS = new Set([
  "i", "me", "my", "we", "need", "want", "looking", "find", "show", "get", "give",
  "a", "an", "the", "some", "any", "for", "to", "of", "that", "which", "can",
  "do", "does", "is", "are", "something", "please", "with", "about", "on", "in",
]);

/** Words that name an artifact type, singular and plural. */
export const TYPE_WORDS: Record<string, ArtifactType> = {
  plugin: "plugin",
  plugins: "plugin",
  skill: "skill",
  skills: "skill",
  agent: "agent",
  agents: "agent",
  command: "command",
  commands: "command",
  hook: "hook",
  hooks: "hook",
  mcp: "mcp",
};
