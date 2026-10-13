import { githubBlobUrl } from "@/lib/catalog/urls";

const ABSOLUTE = /^([a-z][a-z0-9+.-]*:|\/\/|#)/i;

/**
 * Rewrites a repo-relative Markdown link to a GitHub blob URL.
 * Absolute URLs, protocol-relative URLs, anchors and mailto: links pass through.
 */
export function rewriteRelativeLink(
  href: string,
  sourcePath: string,
  repoUrl: string,
): string {
  if (href === "" || ABSOLUTE.test(href)) return href;

  const suffixAt = href.search(/[?#]/);
  const target = suffixAt === -1 ? href : href.slice(0, suffixAt);
  const suffix = suffixAt === -1 ? "" : href.slice(suffixAt);

  const segments = target.startsWith("/")
    ? []
    : sourcePath.split("/").slice(0, -1);
  for (const part of target.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") segments.pop();
    else segments.push(part);
  }
  return githubBlobUrl(repoUrl, segments.join("/")) + suffix;
}
