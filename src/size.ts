/** Control heights shared by buttons and inputs: sm 36px, md 40px, lg 44px. */
export type ControlSize = "sm" | "md" | "lg";

export const controlHeight: Record<ControlSize, string> = {
  sm: "h-9",
  md: "h-10",
  lg: "h-11",
};
