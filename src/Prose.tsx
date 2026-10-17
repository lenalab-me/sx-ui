import type { ReactNode } from "react";

// The typography of the elements a long text is made of; the screen passes the elements (rendered Markdown
// or sanitized HTML) and writes none of these styles itself.
const prose = [
  "max-w-180 break-words text-sx-base leading-[1.85] text-sx-strong",
  "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-sx-heading [&_h2]:leading-snug [&_h2]:font-medium",
  "[&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:text-sx-lead [&_h3]:font-medium",
  "[&>:first-child]:mt-0 [&>:last-child]:mb-0",
  "[&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
  "[&_strong]:font-semibold",
  "[&_a]:text-sx-accent-ink [&_a]:underline [&_a]:underline-offset-4",
  "[&_code]:rounded-sx-check [&_code]:bg-sx-fill [&_code]:px-1 [&_code]:font-sx-mono [&_code]:text-sx-meta",
  "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-sx-control [&_pre]:border [&_pre]:border-sx-line [&_pre]:bg-sx-subtle [&_pre]:px-4 [&_pre]:py-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-sx-line [&_blockquote]:pl-4 [&_blockquote]:text-sx-body",
  "[&_hr]:my-8 [&_hr]:border-sx-line",
  "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_th]:border-b [&_th]:border-sx-line [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_td]:border-b [&_td]:border-sx-row [&_td]:px-3 [&_td]:py-2",
  "[&_img]:max-w-full [&_img]:rounded-sx-control",
].join(" ");

/**
 * A long text to read (an article, an explanation): headings, paragraphs, lists, code, quotes, links and
 * tables laid out for reading, with the line length kept readable (max 720px). The content is the rendered
 * elements; the screen renders Markdown (or sets sanitized HTML) inside it and does not style them.
 */
export function Prose({ children }: { children: ReactNode }) {
  return <div className={prose}>{children}</div>;
}
