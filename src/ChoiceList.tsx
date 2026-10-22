import { useId, type ReactNode } from "react";
import {
  AnswerStatus,
  AnswerVerdict,
  answerBox,
  ChoiceMark,
  type ChoiceMarkState,
} from "./Answer";
import { focusRingWithin } from "./focus";

/**
 * The choices of a question: radios, or checkboxes with `multiple` (the marks are squares). A choice
 * is a whole row to click. Once `revealed` the right ones and a chosen wrong one say so in words
 * and an icon, not color alone, and a right one left out says "正解（選んでいません）". With
 * `multiple` and `max`, once `max` are chosen the others are muted and cannot be chosen until one is
 * taken back. `name` names the group for a screen reader. The hidden line that speaks the result once
 * revealed is part of this; the screen does not repeat the verdict in a Notice.
 */
export function ChoiceList({
  name,
  choices,
  selected,
  onChange,
  revealed = false,
  multiple = false,
  max = Infinity,
}: {
  name: string;
  choices: { id: string; label: ReactNode; correct?: boolean }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  revealed?: boolean;
  multiple?: boolean;
  max?: number;
}) {
  const group = useId();
  const full = multiple && !revealed && selected.length >= max;
  const toggle = (id: string) => {
    if (!multiple) return onChange([id]);
    if (selected.includes(id))
      return onChange(selected.filter((s) => s !== id));
    if (selected.length < max) onChange([...selected, id]);
  };
  const allRight = choices.every(
    (c) => selected.includes(c.id) === Boolean(c.correct),
  );
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0">
      <legend className="sr-only">{name}</legend>
      <AnswerStatus
        text={
          !revealed
            ? ""
            : allRight
              ? "正解です"
              : `不正解です。正解は ${choices
                  .filter((c) => c.correct)
                  .map((c) => c.id)
                  .join("・")} です`
        }
      />
      {choices.map((c) => {
        const chosen = selected.includes(c.id);
        const dim = full && !chosen;
        const state: ChoiceMarkState = !revealed
          ? chosen
            ? "chosen"
            : dim
              ? "dim"
              : "idle"
          : c.correct
            ? chosen
              ? "correct"
              : "missed"
            : chosen
              ? "wrong"
              : "idle";
        const box = {
          idle: `border-sx-line bg-sx-surface ${revealed ? "" : "cursor-pointer hover:bg-sx-subtle"}`,
          chosen:
            "cursor-pointer border-sx-accent bg-sx-accent-soft ring-1 ring-sx-accent",
          correct: answerBox.correct,
          wrong: answerBox.wrong,
          missed: "border-dashed border-sx-ok-ink bg-sx-surface",
          // A muted surface and muted text, not opacity: sx-muted on sx-fill is 4.5:1.
          dim: "cursor-not-allowed border-sx-line bg-sx-fill text-sx-muted",
        }[state];
        return (
          <label
            key={c.id}
            className={`flex items-start gap-3 rounded-sx-control border px-4 py-3.5 ${focusRingWithin} ${box}`}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={group}
              className="sr-only"
              checked={chosen}
              disabled={revealed || dim}
              onChange={() => toggle(c.id)}
            />
            <ChoiceMark state={state} shape={multiple ? "square" : "circle"}>
              {c.id}
            </ChoiceMark>
            <span className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
              {/* The mark (aria-hidden) shows the id that the result line speaks ("正解は B です"), so the name has it too. */}
              <span>
                <span className="sr-only">{c.id}：</span>
                {c.label}
              </span>
              {(state === "correct" || state === "missed") && (
                <AnswerVerdict correct mine={chosen} />
              )}
              {state === "wrong" && <AnswerVerdict correct={false} />}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
