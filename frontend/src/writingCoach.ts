export type InputMode = "dictionary" | "writing";

export const QUICK_GOALS = [
  "Fix grammar",
  "Sound natural",
  "Professional",
  "Casual",
  "Keep it simple",
] as const;

export function detectInputMode(text: string): InputMode {
  const isSingleEnglishWord = /^[A-Za-z]+(?:['’-][A-Za-z]+)*$/.test(
    text.trim(),
  );

  return isSingleEnglishWord ? "dictionary" : "writing";
}
