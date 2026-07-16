import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (request, response) => {
  response.status(404).json({
    error: "Not Found",
    message: `Route ${request.method} ${request.originalUrl} was not found.`,
  });
};

export const globalErrorHandler: ErrorRequestHandler = (
  _error,
  _request,
  response,
  _next,
) => {
  response.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected error occurred.",
  });
};
