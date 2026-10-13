import "server-only";
import path from "node:path";
import { loadCatalog } from "./load";
import type { Catalog } from "./types";

let cached: Catalog | undefined;

export function getCatalog(): Catalog {
  cached ??= loadCatalog(path.resolve(process.cwd(), ".."));
  return cached;
}

export * from "./types";
export * from "./urls";
