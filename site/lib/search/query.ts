import type { ArtifactType } from "@/lib/catalog/types";
import { STOPWORDS, TYPE_WORDS } from "./stopwords";

/**
 * Normalizes a free-text query. Filler and type words are removed; when nothing
 * else remains, the first type word becomes `typeFilter`.
 */
export function cleanQuery(raw: string): { terms: string; typeFilter?: ArtifactType } {
  const tokens = raw.toLowerCase().split(/\s+/).filter(Boolean);
  const kept: string[] = [];
  let typeFilter: ArtifactType | undefined;
  for (const rawToken of tokens) {
    const token = rawToken.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (!token) continue;
    if (STOPWORDS.has(token)) continue;
    const type = TYPE_WORDS[token];
    if (type) {
      typeFilter ??= type;
      continue;
    }
    kept.push(token);
  }
  const terms = kept.join(" ");
  return terms || !typeFilter ? { terms } : { terms, typeFilter };
}
