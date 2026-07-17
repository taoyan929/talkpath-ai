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

export const writingKeyPhraseSchema = z.object({
  phrase: z.string(),
  meaning: z.string(),
  example: z.string(),
});

export const writingWordMeaningSchema = z.object({
  part_of_speech: z.string(),
  meaning: z.string(),
  example: z.string(),
});

export const writingWordDetailsSchema = z.object({
  word: z.string(),
  pronunciation: z.string(),
  meanings: z.array(writingWordMeaningSchema).min(1).max(3),
});

export const writingFeedbackResponseSchema = z.object({
  overall_feedback: z.string(),
  corrected_text: z.string(),
  natural_version: z.string(),
  suggestions: z.array(writingSuggestionSchema),
  key_phrases: z.array(writingKeyPhraseSchema).max(3),
  word_details: writingWordDetailsSchema.nullable(),
});

export type WritingFeedbackRequest = z.infer<
  typeof writingFeedbackRequestSchema
>;
export type WritingSuggestion = z.infer<typeof writingSuggestionSchema>;
export type WritingKeyPhrase = z.infer<typeof writingKeyPhraseSchema>;
export type WritingWordDetails = z.infer<typeof writingWordDetailsSchema>;
export type WritingFeedbackResponse = z.infer<
  typeof writingFeedbackResponseSchema
>;
