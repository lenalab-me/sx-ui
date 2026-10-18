import type { ReactNode } from "react";
import { Icon } from "./icons";

// The parts of an answer area for an exam question: the mark (the letter or number disc), the words
// under a revealed answer, the instruction over the area, and the frame a revealed row gets. The list
// parts (ChoiceList, MatchList, OrderList) are built from these.

export type ChoiceMarkState =
  "idle" | "chosen" | "correct" | "wrong" | "missed" | "dim";

const markLook: Record<ChoiceMarkState, string> = {
  idle: "border-sx-control bg-sx-surface text-sx-body",
  chosen: "border-sx-accent bg-sx-accent text-sx-on-solid",
  correct: "border-sx-ok-ink bg-sx-ok-ink text-sx-on-solid",
  wrong: "border-sx-error-ink bg-sx-error-ink text-sx-on-solid",
  missed: "border-sx-ok-ink bg-sx-surface text-sx-ok-ink",
  dim: "border-sx-line bg-sx-fill text-sx-muted",
};

/**
 * The letter or number at the left of a choice, row or step. Once revealed a right answer trades it
 * for a check and a wrong one for a cross; `keep` holds the letter or number (a row or a step keeps
 * its number, and its verdict line carries the icon instead). The square is the multiple choice.
 * `dim` is a choice that can no longer be chosen (the limit is reached). It is decoration: the
 * meaning is in the words next to it.
 */
export function ChoiceMark({
  children,
  state,
  shape = "circle",
  keep = false,
}: {
  children: ReactNode;
  state: ChoiceMarkState;
  shape?: "circle" | "square";
  keep?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-7 shrink-0 items-center justify-center border text-sx-meta font-semibold ${shape === "circle" ? "rounded-full" : "rounded-sx-check"} ${markLook[state]}`}
    >
      {keep ? (
        children
      ) : state === "correct" || state === "missed" ? (
        <Icon name="check" />
      ) : state === "wrong" ? (
        <Icon name="x" />
      ) : (
        children
      )}
    </span>
  );
}

/** The frame of a revealed row: the same for a choice, a matching row and a step. */
export const answerBox = {
  correct: "border-sx-ok-ink bg-sx-ok-bg ring-1 ring-sx-ok-ink",
  wrong: "border-sx-error-ink bg-sx-error-bg ring-1 ring-sx-error-ink",
};

/**
 * The words under a revealed answer: "正解（あなたの解答）" (or "正解（選んでいません）" for a right one
 * the reader left out, `mine={false}`), or "不正解（あなたの解答）" with "正しくは …". `icon` starts it with
 * the check or the cross, for a row whose mark keeps its number.
 */
export function AnswerVerdict({
  correct,
  mine = true,
  right,
  icon = false,
}: {
  correct: boolean;
  mine?: boolean;
  right?: ReactNode;
  icon?: boolean;
}) {
  return correct ? (
    <span className="flex items-center gap-1 text-sx-meta font-medium text-sx-ok-ink">
      {icon && <Icon name="check" size={14} />}
      正解{mine ? "（あなたの解答）" : "（選んでいません）"}
    </span>
  ) : (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sx-meta">
      <span className="flex items-center gap-1 font-medium text-sx-error-ink">
        {icon && <Icon name="x" size={14} />}
        不正解（あなたの解答）
      </span>
      {right && (
        <span className="text-sx-strong">
          正しくは <span className="font-medium">{right}</span>
        </span>
      )}
    </span>
  );
}

/**
 * The instruction over the answer area ("1 つ選んでください"), with how far the reader is when the
 * question asks for several (`count`). Leave `count` out once revealed. When the limit of a multiple
 * choice is reached the screen passes other words ("上限の 2 つまで選びました").
 */
export function AnswerHint({
  children,
  count,
}: {
  children: ReactNode;
  count?: { done: number; of: number };
}) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="flex items-center gap-2 font-medium text-sx-strong">
        <Icon name="info" />
        {children}
      </span>
      {count && (
        <span className="text-sx-meta text-sx-muted tabular-nums">{`${count.done} / ${count.of} 選択済み`}</span>
      )}
    </p>
  );
}

/**
 * The one line a screen reader hears once the answer is revealed. The result itself is said on the
 * rows by words and icons (AnswerVerdict), so this hidden line is only for assistive technology;
 * it is empty until `text` is given.
 */
export function AnswerStatus({ text }: { text: string }) {
  return (
    <p role="status" className="sr-only">
      {text}
    </p>
  );
}
