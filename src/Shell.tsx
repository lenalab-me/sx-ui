import { FileStack, Network, PanelLeft, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { focusRing } from "./focus";

const MENU_KEY = "nd-menu";

// Screens name an icon; the mapping to the icon library stays in this package.
const navIcons = { projects: FileStack };

export interface NavEntry {
  label: string;
  href: string;
  icon: keyof typeof navIcons;
  current?: boolean;
}

function NavItem({
  entry,
  collapsed,
}: {
  entry: NavEntry;
  collapsed: boolean;
}) {
  const Glyph = navIcons[entry.icon];
  return (
    <li>
      <a
        href={entry.href}
        title={collapsed ? entry.label : undefined}
        aria-current={entry.current ? "page" : undefined}
        className={`flex h-11 items-center gap-3 rounded-sx-control px-3 text-sx-base transition-colors ${focusRing} ${
          entry.current
            ? "border border-sx-line bg-sx-surface font-medium text-sx-strong shadow-sx-raised"
            : "text-sx-body hover:bg-sx-fill"
        } ${collapsed ? "justify-center px-0" : ""}`}
      >
        <span aria-hidden="true" className="shrink-0">
          <Glyph size={20} />
        </span>
        <span className={collapsed ? "sr-only" : "whitespace-nowrap"}>
          {entry.label}
        </span>
      </a>
    </li>
  );
}

/**
 * The left pane is the entry to the whole app. It holds no workflow steps (those are the Stepper
 * at the top of a site screen). The bottom-left slot is where the signed-in user goes; there is
 * no login, so it states the current situation instead of showing a made-up name.
 */
function Sidebar({
  entries,
  homeHref,
  collapsed,
  onToggle,
}: {
  entries: NavEntry[];
  homeHref: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={`flex shrink-0 flex-col gap-5 overflow-y-auto border-r border-sx-line bg-sx-canvas py-6 transition-all ${collapsed ? "w-18 px-3" : "w-66 px-5"}`}
    >
      <div
        className={`flex items-center ${collapsed ? "flex-col gap-3" : "justify-between px-1"}`}
      >
        <a
          href={homeHref}
          className={`flex items-center gap-2.5 rounded-sx-tile ${focusRing}`}
        >
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sx-accent text-sx-on-solid"
          >
            <Network size={18} />
          </span>
          <span
            className={
              collapsed
                ? "sr-only"
                : "text-sx-base font-semibold whitespace-nowrap"
            }
          >
            Network Designer
          </span>
        </a>
        <button
          type="button"
          aria-label={collapsed ? "メニューを開く" : "メニューを閉じる"}
          aria-expanded={!collapsed}
          onClick={onToggle}
          className={`rounded-sx-tile p-1.5 text-sx-muted hover:bg-sx-fill ${focusRing}`}
        >
          <PanelLeft size={20} aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="メインメニュー">
        <ul className="flex flex-col gap-1">
          {entries.map((entry) => (
            <NavItem key={entry.href} entry={entry} collapsed={collapsed} />
          ))}
        </ul>
      </nav>

      <div
        data-user-slot
        className={`mt-auto flex items-center gap-3 border-t border-sx-line pt-4 ${collapsed ? "justify-center" : "px-1"}`}
        title={collapsed ? "ローカル利用（ログインなし）" : undefined}
      >
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sx-fill text-sx-muted"
        >
          <UserRound size={20} />
        </span>
        <div className={collapsed ? "sr-only" : "flex flex-col leading-tight"}>
          <span className="font-medium">ローカル利用</span>
          <span className="text-sx-meta text-sx-muted">ログインなし</span>
        </div>
      </div>
    </aside>
  );
}

/**
 * The app shell. It takes the height of the window; the left pane and the page header stay put
 * and only main scrolls. A screen puts a <Page> inside. The root carries the base font, color and
 * line-breaking rules and the data-nd marker that scopes the package's reset; nothing is
 * written to html or body.
 */
export function Shell({
  entries,
  homeHref,
  children,
}: {
  entries: NavEntry[];
  homeHref: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(
    () => sessionStorage.getItem(MENU_KEY) === "closed",
  );
  const toggle = () =>
    setCollapsed((c) => {
      sessionStorage.setItem(MENU_KEY, c ? "open" : "closed");
      return !c;
    });
  return (
    <div
      data-nd
      className="box-border h-dvh bg-sx-frame p-1.5 font-sx text-sx-base leading-[1.6] text-sx-strong antialiased scheme-light [line-break:strict] [word-break:auto-phrase]"
    >
      <a
        href="#main"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-sx-control focus:bg-sx-surface focus:px-4 focus:py-2 ${focusRing}`}
      >
        本文へ移動
      </a>
      {/* relative: sr-only text is absolutely positioned and must not stretch the document */}
      <div className="relative box-border flex h-full overflow-clip rounded-sx-frame border border-sx-line bg-sx-canvas">
        <Sidebar
          entries={entries}
          homeHref={homeHref}
          collapsed={collapsed}
          onToggle={toggle}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
