import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
} from "react";
import { focusRing } from "./focus";
import { Icon, type IconName } from "./icons";
import { controlHeight, type ControlSize } from "./size";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-sx-accent text-sx-on-solid hover:bg-sx-accent-hover disabled:bg-sx-fill disabled:text-sx-muted",
  secondary:
    "border border-sx-line bg-sx-surface text-sx-strong shadow-sx-card hover:bg-sx-subtle disabled:bg-sx-fill disabled:text-sx-muted disabled:shadow-none",
  ghost: "text-sx-body hover:bg-sx-fill disabled:text-sx-muted",
  danger:
    "bg-sx-error-ink text-sx-on-solid hover:opacity-90 disabled:bg-sx-fill disabled:text-sx-muted",
};
const sizes: Record<ControlSize, string> = {
  lg: "px-5 gap-2 text-sx-base",
  md: "px-4 gap-2 text-sx-base",
  sm: "px-3 gap-1.5 text-sx-meta",
};
const iconSizes: Record<ControlSize, number> = { lg: 18, md: 18, sm: 16 };

const buttonClass = (variant: ButtonVariant, size: ControlSize) =>
  `relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-sx-control font-medium disabled:cursor-not-allowed ${controlHeight[size]} ${variants[variant]} ${sizes[size]} ${focusRing}`;

// 見た目は variant・size で受けるので、style は受けない（className は配置のためだけ）。
type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> & {
  variant?: ButtonVariant;
  size?: ControlSize;
  icon?: IconName;
};

/** A real `disabled` attribute, not aria-disabled. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "secondary",
      size = "md",
      icon,
      className = "",
      children,
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={`${buttonClass(variant, size)} ${className}`}
        {...rest}
      >
        {icon && <Icon name={icon} size={iconSizes[size]} />}
        {children}
      </button>
    );
  },
);

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "style"> & {
  variant?: ButtonVariant;
  size?: ControlSize;
  icon?: IconName;
};

/** Navigation that looks like a button stays an <a>. */
export function ButtonLink({
  variant = "secondary",
  size = "sm",
  icon,
  className = "",
  children,
  ...rest
}: LinkProps) {
  return (
    <a className={`${buttonClass(variant, size)} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={iconSizes[size]} />}
      {children}
    </a>
  );
}

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "className" | "style" | "title"
> & { label: string; icon: IconName; size?: ControlSize };

const iconBox: Record<ControlSize, string> = {
  lg: "size-11",
  md: "size-10",
  sm: "size-9",
};

/** An icon-only button. `label` becomes aria-label and the tooltip (required). */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, icon, size = "sm", type = "button", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        className={`inline-flex ${iconBox[size]} shrink-0 items-center justify-center rounded-sx-tile text-sx-muted hover:bg-sx-fill hover:text-sx-strong disabled:cursor-not-allowed disabled:text-sx-control ${focusRing}`}
        {...rest}
      >
        <Icon name={icon} size={20} />
      </button>
    );
  },
);
