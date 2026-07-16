import { Router } from "express";

import {
  writingFeedbackRequestSchema,
  writingFeedbackResponseSchema,
} from "../schemas/writing";

export const writingRouter = Router();

const mockFeedback = writingFeedbackResponseSchema.parse({
  overall_feedback:
    "Your message is understandable, but some grammar and word choices can be improved.",
  corrected_text: "I went to the supermarket yesterday.",
  suggestions: [
    {
      category: "grammar",
      original: "go",
      replacement: "went",
      explanation: "Use the past tense because the action happened yesterday.",
    },
    {
      category: "article",
      original: "supermarket",
      replacement: "the supermarket",
      explanation:
        "Use 'the' when referring to a specific place in this context.",
    },
  ],
});

writingRouter.post("/feedback", (request, response) => {
  const validationResult = writingFeedbackRequestSchema.safeParse(request.body);

  if (!validationResult.success) {
    return response.status(422).json({
      detail: validationResult.error.issues.map((issue) => ({
        type: issue.code,
        loc: ["body", ...issue.path],
        msg: issue.message,
      })),
    });
  }

  return response.json(mockFeedback);
});
