import type { ErrorRequestHandler, RequestHandler } from "express";

import { WritingFeedbackProviderError } from "../providers/gemini-writing";

export const notFoundHandler: RequestHandler = (request, response) => {
  response.status(404).json({
    error: "Not Found",
    message: `Route ${request.method} ${request.originalUrl} was not found.`,
  });
};

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof WritingFeedbackProviderError) {
    const providerErrors = {
      invalid_response: {
        status: 502,
        error: "Invalid Writing Coach Response",
        message:
          "The Writing Coach returned an invalid response. Please try again.",
      },
      timeout: {
        status: 504,
        error: "Writing Coach Timeout",
        message: "The Writing Coach took too long to respond. Please try again.",
      },
      unavailable: {
        status: 503,
        error: "Writing Coach Unavailable",
        message:
          "The Writing Coach service is temporarily unavailable. Please try again.",
      },
    } as const;
    const providerError = providerErrors[error.kind];

    response.status(providerError.status).json({
      error: providerError.error,
      message: providerError.message,
    });
    return;
  }

  response.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected error occurred.",
  });
};
