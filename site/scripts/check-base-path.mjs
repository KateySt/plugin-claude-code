import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ATTR = /\b(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function hasBase(value, basePath) {
  return (
    value === basePath ||
    value.startsWith(`${basePath}/`) ||
    value.startsWith(`${basePath}?`) ||
    value.startsWith(`${basePath}#`)
  );
}

export function checkBasePath(outDir, basePath) {
  const offenders = [];
  for (const file of walk(outDir)) {
    const html = readFileSync(file, "utf8");
    const rel = path.relative(outDir, file).split(path.sep).join("/");
    for (const match of html.matchAll(ATTR)) {
      const value = match[2] ?? match[3];
      if (!value.startsWith("/") || value.startsWith("//")) continue;
      if (!hasBase(value, basePath)) offenders.push(`${rel}: ${match[1]}=${value}`);
    }
  }
  return offenders;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [outDir = "out", basePath = ""] = process.argv.slice(2);
  const offenders = checkBasePath(outDir, basePath);
  if (offenders.length > 0) {
    console.error(`Found ${offenders.length} value(s) missing base path "${basePath}":`);
    for (const line of offenders) console.error(`  ${line}`);
    process.exit(1);
  }
  console.log(`Base path check passed (${outDir}, "${basePath}").`);
}
