import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export interface ConfirmQuestion {
  /** The heading; by convention "{confirm}前の確認" (see confirmTitle). */
  title: string;
  message: string;
  /** The label of the confirming button (for example "接続を削除する"). */
  confirm: string;
  /** An optional third choice (for example "このまま進む"), placed between cancel and confirm. */
  third?: string;
  /** Draw the confirming button in the danger color. */
  danger?: boolean;
}
export type ConfirmResult = "confirm" | "third" | "cancel";

/** "{ボタン名}前の確認" */
export const confirmTitle = (button: string) => `${button}前の確認`;

/**
 * The confirmation dialog. Buttons: "キャンセル", the optional third choice, then the confirming one. Esc and × answer "cancel".
 * `children` is the content to confirm, shown under the message (for example a DescriptionList of who borrows what, and until when).
 */
export function ConfirmDialog({
  q,
  onAnswer,
  children,
}: {
  q: ConfirmQuestion;
  onAnswer: (r: ConfirmResult) => void;
  children?: ReactNode;
}) {
  return (
    <Modal
      title={q.title}
      onClose={() => onAnswer("cancel")}
      size="sm"
      footer={
        <>
          <Button onClick={() => onAnswer("cancel")}>キャンセル</Button>
          {q.third && (
            <Button onClick={() => onAnswer("third")}>{q.third}</Button>
          )}
          <Button
            variant={q.danger ? "danger" : "primary"}
            onClick={() => onAnswer("confirm")}
          >
            {q.confirm}
          </Button>
        </>
      }
    >
      <p className="text-sx-body">{q.message}</p>
      {children}
    </Modal>
  );
}
