import type { AnchorHTMLAttributes } from "react";
import { focusRing } from "./focus";
import { LinkText } from "./LinkText";

type TextLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "className" | "style"
>;

/**
 * A link inside text or a table cell (the name that opens the detail). It has no padding, so it
 * lines up with the heading and the other cells; the underline is what marks it as a link. The
 * link that looks like a button is ButtonLink.
 */
export function TextLink({ children, ...rest }: TextLinkProps) {
  return (
    <a
      className={`text-sx-accent-ink underline underline-offset-4 hover:text-sx-strong ${focusRing}`}
      {...rest}
    >
      <LinkText>{children}</LinkText>
    </a>
  );
}
