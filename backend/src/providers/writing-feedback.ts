import {
  writingFeedbackResponseSchema,
  type WritingFeedbackResponse,
} from "../schemas/writing";
import {
  createGeminiWritingFeedbackProvider,
  type WritingFeedbackProvider,
} from "./gemini-writing";

const mockFeedback: WritingFeedbackResponse =
  writingFeedbackResponseSchema.parse({
    overall_feedback:
      "Your meaning is clear. Focus on the past tense and the article before the place.",
    corrected_text: "I went to the supermarket yesterday.",
    natural_version: "I went to the supermarket yesterday.",
    suggestions: [
      {
        category: "grammar",
        original: "go",
        replacement: "went",
        explanation:
          "Use the past tense because the action happened yesterday.",
      },
      {
        category: "article",
        original: "supermarket",
        replacement: "the supermarket",
        explanation:
          "Use 'the' when referring to a specific place in this context.",
      },
    ],
    key_phrases: [
      {
        phrase: "went to",
        meaning: "travelled to or visited a place",
        example: "We went to the library after lunch.",
      },
    ],
    word_details: null,
  });

export const mockWritingFeedbackProvider: WritingFeedbackProvider = () =>
  Promise.resolve(mockFeedback);

export function getWritingFeedbackProvider(): WritingFeedbackProvider {
  const providerName = process.env.WRITING_FEEDBACK_PROVIDER ?? "mock";

  if (providerName === "mock") {
    return mockWritingFeedbackProvider;
  }

  if (providerName === "gemini") {
    return createGeminiWritingFeedbackProvider();
  }

  throw new Error(
    'WRITING_FEEDBACK_PROVIDER must be set to either "mock" or "gemini"',
  );
}
