import cors from "cors";
import express, { type Express } from "express";

import { globalErrorHandler, notFoundHandler } from "./middleware/errors";
import { getWritingFeedbackProvider } from "./providers/writing-feedback";
import type { WritingFeedbackProvider } from "./providers/gemini-writing";
import { healthRouter } from "./routes/health";
import { createWritingRouter } from "./routes/writing";

export function createApp(
  writingFeedbackProvider: WritingFeedbackProvider =
    getWritingFeedbackProvider(),
): Express {
  const app = express();

  app.use(
    cors({
      origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get("/", (_request, response) => {
    response.json({ message: "Welcome to TalkPath AI backend" });
  });

  app.use("/api", healthRouter);
  app.use("/api/writing", createWritingRouter(writingFeedbackProvider));

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
