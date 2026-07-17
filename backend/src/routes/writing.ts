import { Router } from "express";

import type { WritingFeedbackProvider } from "../providers/gemini-writing";
import { writingFeedbackRequestSchema } from "../schemas/writing";

export function createWritingRouter(provider: WritingFeedbackProvider): Router {
  const router = Router();

  router.post("/feedback", async (request, response) => {
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

    const feedback = await provider(validationResult.data);
    return response.json(feedback);
  });

  return router;
}
