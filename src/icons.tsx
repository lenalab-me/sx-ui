import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Download,
  Ellipsis,
  Eye,
  EyeOff,
  FileCog,
  FileText,
  Info,
  LayoutGrid,
  Maximize,
  Plus,
  Undo2,
  X,
  type LucideIcon,
} from "lucide-react";

// Screens name an icon; only this package imports the icon library.
const icons = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "chevron-down": ChevronDown,
  "circle-alert": CircleAlert,
  "circle-check": CircleCheck,
  download: Download,
  ellipsis: Ellipsis,
  eye: Eye,
  "eye-off": EyeOff,
  "file-cog": FileCog,
  "file-text": FileText,
  info: Info,
  "layout-grid": LayoutGrid,
  maximize: Maximize,
  plus: Plus,
  undo: Undo2,
  x: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

/** A decorative icon (hidden from assistive technology). Put the meaning in nearby text or a label. */
export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const Glyph = icons[name];
  return <Glyph size={size} aria-hidden="true" className="shrink-0" />;
}
