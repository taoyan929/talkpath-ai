import { z } from "zod";

export const writingFeedbackRequestSchema = z.object({
  text: z
    .string()
    .min(1, "text must contain at least 1 character")
    .max(5000, "text must contain at most 5000 characters")
    .refine((text) => text.trim().length > 0, {
      message: "text must not contain only whitespace",
    }),
  goal: z.string().nullable().optional(),
});

export const writingSuggestionSchema = z.object({
  category: z.string(),
  original: z.string(),
  replacement: z.string(),
  explanation: z.string(),
});

export const writingFeedbackResponseSchema = z.object({
  overall_feedback: z.string(),
  corrected_text: z.string(),
  suggestions: z.array(writingSuggestionSchema),
});

export type WritingFeedbackRequest = z.infer<
  typeof writingFeedbackRequestSchema
>;
export type WritingSuggestion = z.infer<typeof writingSuggestionSchema>;
export type WritingFeedbackResponse = z.infer<
  typeof writingFeedbackResponseSchema
>;
