import {
  BookOpen,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  FileStack,
  History,
  House,
  List,
  LogOut,
  Menu as MenuGlyph,
  Network,
  Package,
  PanelLeft,
  Play,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { focusRing } from "./focus";

const MENU_KEY = "nd-menu";

// Screens name an icon; the mapping to the icon library stays in this package.
const navIcons = {
  book: BookOpen,
  calendar: CalendarDays,
  chart: ChartColumn,
  history: History,
  home: House,
  list: List,
  package: Package,
  play: Play,
  projects: FileStack,
  settings: Settings,
  shield: ShieldCheck,
  tasks: ClipboardList,
  users: Users,
};

/** The icons the left pane offers (a separate set from IconName: the pane's are 20px and carry a label beside them). */
export type NavIconName = keyof typeof navIcons;

/** The signed-in user, for the bottom-left slot: a name, a line under it (a role), and a sign-out button when given. */
export interface ShellAccount {
  name: string;
  detail?: string;
  onSignOut?: () => void;
}

export interface NavEntry {
  label: string;
  href: string;
  icon: NavIconName;
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

/** The logo and the app's name. `hideName` keeps the name for assistive technology only (the collapsed pane). */
function Logo({
  product,
  mark,
  homeHref,
  hideName = false,
}: {
  product: string;
  mark?: string;
  homeHref: string;
  hideName?: boolean;
}) {
  return (
    <a
      href={homeHref}
      className={`flex items-center gap-2.5 rounded-sx-tile ${focusRing}`}
    >
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sx-accent text-sx-on-solid"
      >
        {mark ? (
          <span className="text-sx-base font-semibold">{mark}</span>
        ) : (
          <Network size={18} />
        )}
      </span>
      <span
        className={
          hideName ? "sr-only" : "text-sx-base font-semibold whitespace-nowrap"
        }
      >
        {product}
      </span>
    </a>
  );
}

/** The bottom-left slot of the pane (and the bottom of the drawer): who is signed in, and the sign-out button. */
function AccountSlot({
  account,
  collapsed,
  onSignOut,
}: {
  account?: ShellAccount;
  collapsed: boolean;
  /** What the sign-out button calls instead of `account.onSignOut` (the drawer closes first). */
  onSignOut?: () => void;
}) {
  return (
    <div
      data-user-slot
      className={`mt-auto flex items-center gap-3 border-t border-sx-line pt-4 ${collapsed ? `justify-center ${account?.onSignOut ? "flex-col" : ""}` : "px-1"}`}
      title={
        collapsed
          ? account
            ? account.name
            : "ローカル利用（ログインなし）"
          : undefined
      }
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sx-fill text-sx-muted"
      >
        <UserRound size={20} />
      </span>
      <div
        className={
          collapsed
            ? "sr-only"
            : account
              ? "flex min-w-0 flex-1 flex-col leading-tight"
              : "flex flex-col leading-tight"
        }
      >
        {account ? (
          <>
            <span className="truncate font-medium">{account.name}</span>
            {account.detail && (
              <span className="truncate text-sx-meta text-sx-muted">
                {account.detail}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="font-medium">ローカル利用</span>
            <span className="text-sx-meta text-sx-muted">ログインなし</span>
          </>
        )}
      </div>
      {account?.onSignOut && (
        <button
          type="button"
          aria-label="ログアウト"
          title="ログアウト"
          onClick={onSignOut ?? account.onSignOut}
          className={`rounded-sx-tile p-1.5 text-sx-muted hover:bg-sx-fill ${focusRing}`}
        >
          <LogOut size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/**
 * The left pane is the entry to the whole app. It holds no workflow steps (those are the Stepper
 * at the top of a site screen). The bottom-left slot is where the signed-in user goes; an app
 * without login gives no account, and the slot states that instead of showing a made-up name.
 * Below md it is not shown: the TopBar opens the same entries in a drawer.
 */
function Sidebar({
  product,
  mark,
  entries,
  homeHref,
  collapsed,
  onToggle,
  account,
}: {
  product: string;
  mark?: string;
  entries: NavEntry[];
  homeHref: string;
  collapsed: boolean;
  onToggle: () => void;
  account?: ShellAccount;
}) {
  return (
    <aside
      className={`hidden shrink-0 flex-col gap-5 overflow-y-auto border-r border-sx-line bg-sx-canvas py-6 transition-all md:flex ${collapsed ? "w-18 px-3" : "w-66 px-5"}`}
    >
      <div
        className={`flex items-center ${collapsed ? "flex-col gap-3" : "justify-between px-1"}`}
      >
        <Logo
          product={product}
          mark={mark}
          homeHref={homeHref}
          hideName={collapsed}
        />
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

      <AccountSlot account={account} collapsed={collapsed} />
    </aside>
  );
}

/** The width from which the left pane is shown (Tailwind's md, 48rem). */
const WIDE = "(min-width: 48rem)";

/**
 * The same entries and account as the pane, in a drawer from the right edge: a native <dialog>
 * opened with showModal(), like Modal, so the page behind it is inert and Esc and the focus trap
 * come from the browser. Esc, a click on the backdrop and choosing an entry close it, and focus
 * returns to `opener`. It also closes when the window becomes wide enough for the pane (the
 * TopBar is hidden then, and an open modal would leave the page inert).
 */
function Drawer({
  product,
  mark,
  entries,
  homeHref,
  account,
  opener,
  onClose,
}: {
  product: string;
  mark?: string;
  entries: NavEntry[];
  homeHref: string;
  account?: ShellAccount;
  opener: { current: HTMLElement | null };
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    const wide = matchMedia(WIDE);
    const onWide = (e: MediaQueryListEvent) => e.matches && close.current();
    wide.addEventListener("change", onWide);
    return () => {
      wide.removeEventListener("change", onWide);
      el.close();
      opener.current?.focus();
    };
  }, [opener]);
  return (
    <dialog
      ref={dialog}
      aria-label="メニュー"
      onCancel={(e) => {
        // Handle Esc ourselves so the dialog is never closed behind the caller's back.
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click that lands on the dialog itself is a click on the backdrop (the panel fills it).
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-72 max-w-[85vw] flex-col overflow-hidden border-l border-sx-line bg-sx-canvas text-sx-strong shadow-sx-overlay backdrop:bg-sx-scrim open:flex"
    >
      <div
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4"
        onClick={(e) => {
          // Choosing an entry (or the logo) closes the drawer.
          if ((e.target as HTMLElement).closest("a")) onClose();
        }}
      >
        <div className="flex items-center justify-between px-1">
          <Logo product={product} mark={mark} homeHref={homeHref} />
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={onClose}
            className={`flex size-11 items-center justify-center rounded-sx-tile text-sx-body hover:bg-sx-fill ${focusRing}`}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="メインメニュー">
          <ul className="flex flex-col gap-1">
            {entries.map((entry) => (
              <NavItem key={entry.href} entry={entry} collapsed={false} />
            ))}
          </ul>
        </nav>
        <AccountSlot
          account={account}
          collapsed={false}
          onSignOut={
            account?.onSignOut &&
            (() => {
              onClose();
              account.onSignOut!();
            })
          }
        />
      </div>
    </dialog>
  );
}

/**
 * Below md the left pane is replaced by a band along the top: the logo and the app's name, and
 * (when there are entries) the button that opens the Drawer.
 */
function TopBar({
  product,
  mark,
  entries,
  homeHref,
  account,
}: {
  product: string;
  mark?: string;
  entries: NavEntry[];
  homeHref: string;
  account?: ShellAccount;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-sx-line bg-sx-canvas px-4 md:hidden">
      <Logo product={product} mark={mark} homeHref={homeHref} />
      {entries.length > 0 && (
        <button
          ref={button}
          type="button"
          aria-label="メニューを開く"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={`flex size-11 items-center justify-center rounded-sx-tile text-sx-body hover:bg-sx-fill ${focusRing}`}
        >
          <MenuGlyph size={22} aria-hidden="true" />
        </button>
      )}
      {open && (
        <Drawer
          product={product}
          mark={mark}
          entries={entries}
          homeHref={homeHref}
          account={account}
          opener={button}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * The app shell. It takes the height of the window; the left pane and the page header stay put
 * and only main scrolls. A screen puts a <Page> inside. The root carries the base font, color and
 * line-breaking rules and the data-nd marker that scopes the package's reset; nothing is
 * written to html or body. Below md (a phone) the frame is edge to edge and the left pane gives
 * way to the TopBar and its drawer.
 */
export function Shell({
  product,
  mark,
  entries,
  homeHref,
  account,
  pane = true,
  children,
}: {
  /** The application's name, next to the logo at the top of the pane (and in the band along the top on a phone). */
  product: string;
  /** One or two letters in the logo's circle (the app's initial). Without it the circle shows the network icon. */
  mark?: string;
  entries: NavEntry[];
  homeHref: string;
  /** The signed-in user for the bottom-left slot. Without it the slot says the app is used locally without login. */
  account?: ShellAccount;
  /** false: no left pane, for a screen that has the user's whole attention (answering an exam). The page fills the frame. On a phone the band shows the app's name only, without the menu button. */
  pane?: boolean;
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
      className="box-border h-dvh bg-sx-frame p-0 font-sx text-sx-base leading-[1.6] text-sx-strong antialiased scheme-light md:p-1.5 [line-break:strict] [word-break:auto-phrase]"
    >
      <a
        href="#main"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-sx-control focus:bg-sx-surface focus:px-4 focus:py-2 ${focusRing}`}
      >
        本文へ移動
      </a>
      {/* relative: sr-only text is absolutely positioned and must not stretch the document */}
      <div className="relative box-border flex h-full flex-col overflow-clip bg-sx-canvas md:flex-row md:rounded-sx-frame md:border md:border-sx-line">
        <TopBar
          product={product}
          mark={mark}
          entries={pane ? entries : []}
          homeHref={homeHref}
          account={account}
        />
        {pane && (
          <Sidebar
            product={product}
            mark={mark}
            entries={entries}
            homeHref={homeHref}
            collapsed={collapsed}
            onToggle={toggle}
            account={account}
          />
        )}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
