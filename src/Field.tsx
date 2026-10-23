import { Check } from "lucide-react";
import {
  createContext,
  forwardRef,
  useContext,
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

/**
 * A small supporting line. Not announced by default. Pass `live` when the sentence changes while the
 * learner works (a remaining count, "ready to submit") and the change should be read aloud politely:
 * it becomes a status region. Screens never write the role themselves.
 */
export function SupportText({
  id,
  children,
  live = false,
}: {
  id?: string;
  children: ReactNode;
  live?: boolean;
}) {
  return (
    <p
      id={id}
      role={live ? "status" : undefined}
      className="text-sx-meta text-sx-muted"
    >
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

const InFieldGrid = createContext(false);

// Below md the columns become one (two or three Fields side by side do not fit a phone).
const gridColumns = {
  1: "grid-cols-1",
  2: "grid-cols-2 max-md:grid-cols-1",
  3: "grid-cols-3 max-md:grid-cols-1",
} as const;

/**
 * Fields side by side in columns. Every Field in it spans four rows of the grid (the label, the
 * support text, the control, the error), so the controls line up across a row whether or not
 * a neighbor has support text or an error. Put only Fields in it.
 */
export function FieldGrid({
  columns = 2,
  children,
}: {
  columns?: keyof typeof gridColumns;
  children: ReactNode;
}) {
  return (
    <InFieldGrid value={true}>
      {/* Each Field carries pb-4 as the space to the next row; -mb-4 takes the last one back */}
      <div className={`-mb-4 grid gap-x-6 ${gridColumns[columns]}`}>
        {children}
      </div>
    </InFieldGrid>
  );
}

const rowStart = {
  1: "row-start-1",
  2: "row-start-2",
  3: "row-start-3",
  4: "row-start-4",
} as const;

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
  inline = false,
  children,
  className = "",
}: {
  label: ReactNode;
  support?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** One row: the label at the left, the control (96px wide) at the right. For short values such as a count. */
  inline?: boolean;
  children: (f: FieldIds) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const supportId = support ? `${id}-support` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [supportId, errorId].filter(Boolean).join(" ") || undefined;
  const control = children({ id, describedBy, invalid: Boolean(error) });
  const inGrid = useContext(InFieldGrid);
  // In a FieldGrid each part sits on its own row of the grid, with its spacing as padding
  // (an empty row then takes no space); alone, the parts are stacked with a gap.
  const slot = (row: keyof typeof rowStart, pad: string, node: ReactNode) =>
    inGrid ? <div className={`${rowStart[row]} ${pad}`}>{node}</div> : node;
  const supportText = support && (
    <SupportText id={supportId}>{support}</SupportText>
  );
  const labelText = (
    <Label htmlFor={id} required={required}>
      {label}
    </Label>
  );
  return (
    <div
      className={
        inGrid
          ? `row-span-4 grid grid-rows-subgrid pb-4 ${className}`
          : `flex flex-col gap-1.5 ${className}`
      }
    >
      {inline ? (
        <>
          {slot(
            1,
            "",
            <div className="flex items-center justify-between gap-3">
              {labelText}
              <div className="w-24 shrink-0">{control}</div>
            </div>,
          )}
          {supportText && slot(2, "pt-1.5", supportText)}
        </>
      ) : (
        <>
          {slot(1, "pb-1.5", labelText)}
          {supportText && slot(2, "pb-1.5", supportText)}
          {slot(3, "", control)}
        </>
      )}
      {error && slot(4, "pt-1.5", <ErrorText id={errorId}>{error}</ErrorText>)}
    </div>
  );
}

type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "style"
> & {
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

type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size" | "style"
> & {
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

type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "style"
> & {
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
  "type" | "size" | "className" | "style"
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
  "type" | "size" | "style"
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
