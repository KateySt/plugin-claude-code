import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { rewriteRelativeLink } from "@/lib/markdown/links";

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

/** Demote each heading one level (h1 -> h2, ... capped at h6) so the page keeps a single h1. */
const demotedHeadings = Object.fromEntries(
  HEADING_LEVELS.map((level) => {
    const Tag = `h${Math.min(level + 1, 6)}` as "h2" | "h3" | "h4" | "h5" | "h6";
    return [`h${level}`, ({ children }: { children?: ReactNode }) => <Tag>{children}</Tag>];
  }),
);

interface MarkdownProps {
  source: string;
  sourcePath: string;
  repoUrl: string;
}

export function Markdown({ source, sourcePath, repoUrl }: MarkdownProps) {
  return (
    <div className="space-y-4 leading-7 [&_a]:text-primary [&_a]:underline [&_code]:font-mono [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_ul]:list-disc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          ...demotedHeadings,
          a: ({ href, children }) => (
            <a href={href ? rewriteRelativeLink(href, sourcePath, repoUrl) : undefined}>
              {children}
            </a>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
