import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import express from "express";

import { app } from "./app";
import { globalErrorHandler, notFoundHandler } from "./middleware/errors";

let server: Server;
let baseUrl: string;

before(() => {
  server = app.listen(0);
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
  server.close();
});

test("GET / keeps the existing welcome response", async () => {
  const response = await fetch(`${baseUrl}/`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    message: "Welcome to TalkPath AI backend",
  });
});

test("GET /api/health keeps the existing health response", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "TalkPath AI backend",
  });
});

test("POST /api/writing/feedback returns the fixed mock response", async () => {
  const response = await fetch(`${baseUrl}/api/writing/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "I go supermarket yesterday.",
      goal: "Improve grammar",
    }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    overall_feedback:
      "Your message is understandable, but some grammar and word choices can be improved.",
    corrected_text: "I went to the supermarket yesterday.",
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
  });
});

test("POST /api/writing/feedback accepts an omitted goal", async () => {
  const response = await fetch(`${baseUrl}/api/writing/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Hello" }),
  });

  assert.equal(response.status, 200);
});

test("POST /api/writing/feedback accepts a null goal for compatibility", async () => {
  const response = await fetch(`${baseUrl}/api/writing/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Hello", goal: null }),
  });

  assert.equal(response.status, 200);
});

test("CORS allows the existing Vite development origin", async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: "http://127.0.0.1:5173" },
  });

  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "http://127.0.0.1:5173",
  );
});

test("POST /api/writing/feedback rejects invalid text", async () => {
  const invalidBodies = [
    {},
    { text: "" },
    { text: "   " },
    { text: "x".repeat(5001) },
  ];

  for (const body of invalidBodies) {
    const response = await fetch(`${baseUrl}/api/writing/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    assert.equal(response.status, 422);
  }
});

test("unknown routes return a JSON 404 response", async () => {
  const response = await fetch(`${baseUrl}/api/does-not-exist`);

  assert.equal(response.status, 404);
  assert.match(response.headers.get("content-type") ?? "", /application\/json/);
  assert.deepEqual(await response.json(), {
    error: "Not Found",
    message: "Route GET /api/does-not-exist was not found.",
  });
});

test("unexpected server errors return a JSON 500 response", async () => {
  const errorApp = express();

  errorApp.get("/unexpected-error", () => {
    throw new Error("Test error");
  });
  errorApp.use(notFoundHandler);
  errorApp.use(globalErrorHandler);

  const errorServer = errorApp.listen(0);
  const address = errorServer.address() as AddressInfo;

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/unexpected-error`,
    );

    assert.equal(response.status, 500);
    assert.match(
      response.headers.get("content-type") ?? "",
      /application\/json/,
    );
    assert.deepEqual(await response.json(), {
      error: "Internal Server Error",
      message: "An unexpected error occurred.",
    });
  } finally {
    errorServer.close();
  }
});
