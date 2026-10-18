import { useId, type ReactNode } from "react";
import { AnswerStatus, AnswerVerdict, answerBox, ChoiceMark } from "./Answer";
import { Select } from "./Field";

type Option = { id: string; label: string };

const optionText = (options: Option[], id: string) =>
  `${id}. ${options.find((o) => o.id === id)?.label ?? ""}`;

// The words said once for the whole list: "問" for the rows of a matching, "手順" for the steps.
const resultText = (total: number, right: number, unit: string) =>
  right === total
    ? "正解です"
    : `不正解です。${total} ${unit}中 ${right} ${unit}が正解です`;

/** What a revealed row says: the option chosen, and under it the verdict with the right one. */
function Revealed({
  mine,
  right,
  options,
  className = "",
}: {
  mine: string;
  right: string | undefined;
  options: Option[];
  className?: string;
}) {
  return (
    <span className={`flex flex-col gap-1 ${className}`}>
      <span className="font-medium text-sx-strong">
        {mine ? optionText(options, mine) : "（未選択）"}
      </span>
      <AnswerVerdict
        correct={mine === right}
        right={right ? optionText(options, right) : undefined}
        icon
      />
    </span>
  );
}

/**
 * A matching question: one row per description, each with its number and a pull-down of every option
 * (an option may be used by more than one row). `value` holds the option chosen for each row, in
 * order, with "" for a row not answered yet. Once `revealed` the pull-down gives way to the chosen
 * answer and, under it, the verdict with the right one (`correct` holds the right option of each
 * row; give it when revealed). The hidden line that speaks the result is part of this. Below md the
 * pull-down moves under the description.
 */
export function MatchList({
  rows,
  options,
  value,
  onChange,
  revealed = false,
  correct = [],
}: {
  rows: { id: string; label: ReactNode }[];
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  revealed?: boolean;
  correct?: string[];
}) {
  const id = useId();
  const right = rows.filter((_, i) => (value[i] ?? "") === correct[i]).length;
  return (
    <>
      <AnswerStatus
        text={revealed ? resultText(rows.length, right, "問") : ""}
      />
      <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
        {rows.map((row, i) => {
          const mine = value[i] ?? "";
          const state = !revealed
            ? mine
              ? "chosen"
              : "idle"
            : mine === correct[i]
              ? "correct"
              : "wrong";
          const box = revealed
            ? answerBox[state as "correct" | "wrong"]
            : "border-sx-line bg-sx-surface";
          return (
            <li
              key={row.id}
              className={`grid grid-cols-[auto_minmax(0,1fr)_22rem] items-center gap-x-4 gap-y-2 rounded-sx-control border px-4 py-3 max-md:grid-cols-[auto_minmax(0,1fr)] ${box}`}
            >
              <ChoiceMark state={state} keep>
                {i + 1}
              </ChoiceMark>
              <span id={`${id}-${i}`}>{row.label}</span>
              {revealed ? (
                <Revealed
                  mine={mine}
                  right={correct[i]}
                  options={options}
                  className="max-md:col-start-2"
                />
              ) : (
                <Select
                  size="md"
                  className="max-md:col-start-2"
                  aria-labelledby={`${id}-${i}`}
                  value={mine}
                  onChange={(e) =>
                    onChange(
                      rows.map((_, j) =>
                        j === i ? e.target.value : (value[j] ?? ""),
                      ),
                    )
                  }
                >
                  <option value="">選択してください</option>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {`${o.id}. ${o.label}`}
                    </option>
                  ))}
                </Select>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

/**
 * An ordering question: `steps` rows labelled "手順 n" (read out only; the number is drawn), each
 * with a pull-down of the options no other step has taken. `value` is by position: "" for a step
 * not answered yet, so choosing step 3 first leaves steps 1 and 2 empty, and the array is never
 * shortened. Once `revealed` it is the same as MatchList: the chosen option and the verdict with the
 * right one (`correct` holds the right option of each step). Put OptionIndex above it to list the
 * options for reference.
 */
export function OrderList({
  steps,
  options,
  value,
  onChange,
  revealed = false,
  correct = [],
}: {
  steps: number;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  revealed?: boolean;
  correct?: string[];
}) {
  const id = useId();
  const at = (i: number) => value[i] ?? "";
  const pick = (i: number, key: string) =>
    onChange(
      Array.from({ length: steps }, (_, j) =>
        j === i ? key : at(j) === key ? "" : at(j),
      ),
    );
  const right = Array.from({ length: steps }, (_, i) => at(i) === correct[i]);
  return (
    <>
      <AnswerStatus
        text={
          revealed
            ? resultText(steps, right.filter(Boolean).length, "手順")
            : ""
        }
      />
      <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
        {Array.from({ length: steps }, (_, i) => {
          const mine = at(i);
          const state = !revealed
            ? mine
              ? "chosen"
              : "idle"
            : right[i]
              ? "correct"
              : "wrong";
          const box = revealed
            ? answerBox[state as "correct" | "wrong"]
            : "border-sx-line bg-sx-surface";
          return (
            <li
              key={i}
              className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 rounded-sx-control border px-4 py-3 ${box}`}
            >
              <ChoiceMark state={state} keep>
                {i + 1}
              </ChoiceMark>
              <label htmlFor={`${id}-${i}`} className="sr-only">
                {`手順 ${i + 1}`}
              </label>
              {revealed ? (
                <Revealed mine={mine} right={correct[i]} options={options} />
              ) : (
                <Select
                  id={`${id}-${i}`}
                  size="md"
                  value={mine}
                  onChange={(e) => pick(i, e.target.value)}
                >
                  <option value="">選択してください</option>
                  {options
                    .filter((o) => o.id === mine || !value.includes(o.id))
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {`${o.id}. ${o.label}`}
                      </option>
                    ))}
                </Select>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

/**
 * The options of an ordering question, listed for reference above the steps. `used` is the OrderList
 * `value` (the option of each step, "" for none): an option a step has taken says "手順 n に選択中".
 */
export function OptionIndex({
  options,
  used = [],
}: {
  options: Option[];
  used?: string[];
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2 rounded-sx-control bg-sx-subtle px-4 py-3">
      <span id={id} className="text-sx-meta font-medium text-sx-muted">
        選択肢
      </span>
      <ul
        aria-labelledby={id}
        className="m-0 flex list-none flex-col gap-1.5 p-0"
      >
        {options.map((o) => (
          <li key={o.id} className="flex items-start gap-3">
            <span className="w-4 shrink-0 font-semibold text-sx-strong">
              {o.id}
            </span>
            <span className="min-w-0 flex-1">{o.label}</span>
            {used.includes(o.id) && (
              <span className="text-sx-meta whitespace-nowrap text-sx-muted">{`手順 ${used.indexOf(o.id) + 1} に選択中`}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
