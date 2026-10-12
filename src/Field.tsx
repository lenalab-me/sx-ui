import { Check } from "lucide-react";
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { focusRing, focusRingInput } from "./focus";
import { Icon } from "./icons";
import { controlHeight, type ControlSize } from "./size";

// Inputs, selects and checkboxes always carry data-boundary (the contrast audit checks their borders).
// Never put information in a placeholder; explain in SupportText.

const control =
  "w-full rounded-sx-control border border-sx-control bg-sx-surface px-3 text-sx-base text-sx-strong disabled:cursor-not-allowed disabled:bg-sx-fill disabled:text-sx-muted aria-invalid:border-sx-error-dot aria-invalid:border-2";

export function Label({
  htmlFor,
  children,
  required,
  id,
}: {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  id?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      id={id}
      className="flex items-center gap-2 font-medium"
    >
      {children}
      {required && (
        <span className="rounded-sx-tile bg-sx-error-bg px-1.5 text-sx-meta font-medium text-sx-error-ink">
          必須
        </span>
      )}
    </label>
  );
}

export function SupportText({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <p id={id} className="text-sx-meta text-sx-muted">
      {children}
    </p>
  );
}

export function ErrorText({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <p
      id={id}
      className="flex items-center gap-1.5 text-sx-meta font-medium text-sx-error-ink"
    >
      <Icon name="circle-alert" />
      {children}
    </p>
  );
}

export interface FieldIds {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
}

/**
 * One label + support text + error + control. The children callback receives the ids to wire up:
 * <Field label="拠点名" error={err}>{(f) => <Input id={f.id} aria-describedby={f.describedBy} invalid={f.invalid} />}</Field>
 */
export function Field({
  label,
  support,
  error,
  required,
  children,
  className = "",
}: {
  label: ReactNode;
  support?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: (f: FieldIds) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const supportId = support ? `${id}-support` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [supportId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {support && <SupportText id={supportId}>{support}</SupportText>}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error && <ErrorText id={errorId}>{error}</ErrorText>}
    </div>
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  invalid?: boolean;
  size?: ControlSize;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, size = "lg", className = "", ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      data-boundary
      aria-invalid={invalid || undefined}
      className={`${control} ${controlHeight[size]} ${focusRingInput} ${className}`}
      {...rest}
    />
  );
});

export const NumberInput = forwardRef<HTMLInputElement, InputProps>(
  function NumberInput({ className = "", ...rest }, ref) {
    return (
      <Input
        ref={ref}
        type="number"
        inputMode="numeric"
        className={`tabular-nums ${className}`}
        {...rest}
      />
    );
  },
);

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  invalid?: boolean;
  size?: ControlSize;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { invalid, size = "lg", className = "", children, ...rest },
    ref,
  ) {
    return (
      <select
        ref={ref}
        data-boundary
        aria-invalid={invalid || undefined}
        className={`${control} ${controlHeight[size]} pr-8 ${focusRingInput} ${className}`}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, className = "", rows = 3, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        data-boundary
        aria-invalid={invalid || undefined}
        className={`${control} py-2 ${focusRingInput} ${className}`}
        {...rest}
      />
    );
  },
);

type CheckboxInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size" | "className"
> & { size?: "sm" | "md" };

/**
 * The checkbox box. The native control's border is not reported in computed style, so the audit
 * would see white on white (1.00:1); the box is appearance-none and its border, fill and mark are drawn in CSS.
 */
export function CheckboxInput({ size = "md", ...rest }: CheckboxInputProps) {
  const box = size === "md" ? "size-6" : "size-5";
  return (
    <span className={`relative inline-flex shrink-0 align-middle ${box}`}>
      <input
        type="checkbox"
        data-boundary
        className={`peer m-0 ${box} appearance-none rounded-sx-check border-2 border-sx-control bg-sx-surface checked:border-sx-accent checked:bg-sx-accent disabled:cursor-not-allowed disabled:bg-sx-fill disabled:checked:border-sx-control disabled:checked:bg-sx-control aria-disabled:cursor-not-allowed aria-disabled:bg-sx-fill aria-disabled:checked:border-sx-control aria-disabled:checked:bg-sx-control ${focusRing}`}
        {...rest}
      />
      <Check
        size={size === "md" ? 16 : 14}
        strokeWidth={3}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-auto hidden text-sx-on-solid peer-checked:block"
      />
    </span>
  );
}

type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> & { label: ReactNode; support?: ReactNode };

/** A checkbox with its label (the small one inside a table is Check in form-cells). */
export function Checkbox({
  label,
  support,
  className = "",
  id,
  ...rest
}: CheckboxProps) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <span className="mt-0.5 flex">
        <CheckboxInput id={cid} {...rest} />
      </span>
      <label htmlFor={cid} className="flex flex-col">
        <span>{label}</span>
        {support && (
          <span className="text-sx-meta text-sx-muted">{support}</span>
        )}
      </label>
    </div>
  );
}
