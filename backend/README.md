# TalkPath AI Backend

This folder contains the Node.js, Express, and TypeScript backend for TalkPath AI.

The backend currently includes a root endpoint, a health check, and a mock Writing Coach endpoint. It does not include a database, authentication, or AI API integration yet.

## Requirements

- Node.js 18 or newer
- npm

## Install Dependencies

From the backend folder, run:

```bash
npm install
```

## Run the Backend Locally

Start the development server with automatic restarts:

```bash
npm run dev
```

The backend runs at:

```text
http://127.0.0.1:8000
```

To create and run a production build:

```bash
npm run build
npm start
```

## Available Commands

- `npm run dev`: starts the TypeScript development server
- `npm run typecheck`: checks TypeScript types without creating build files
- `npm test`: runs the API contract tests
- `npm run build`: compiles TypeScript into `dist`
- `npm start`: runs the compiled backend

## API Endpoints

- `GET /`: returns a welcome message
- `GET /api/health`: returns the backend health status
- `POST /api/writing/feedback`: validates writing input and returns mock feedback

## Test the Health Endpoint

```bash
curl http://127.0.0.1:8000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "TalkPath AI backend"
}
```

## Test the Writing Coach Endpoint

Send a request with required `text` and an optional `goal`:

```bash
curl -X POST http://127.0.0.1:8000/api/writing/feedback \
  -H "Content-Type: application/json" \
  -d '{"text":"I go supermarket yesterday.","goal":"Improve grammar"}'
```

Example response:

```json
{
  "overall_feedback": "Your message is understandable, but some grammar and word choices can be improved.",
  "corrected_text": "I went to the supermarket yesterday.",
  "suggestions": [
    {
      "category": "grammar",
      "original": "go",
      "replacement": "went",
      "explanation": "Use the past tense because the action happened yesterday."
    },
    {
      "category": "article",
      "original": "supermarket",
      "replacement": "the supermarket",
      "explanation": "Use 'the' when referring to a specific place in this context."
    }
  ]
}
```

The request is validated with Zod. `text` must be a string containing between 1 and 5000 characters and cannot contain only whitespace. `goal` is an optional string; it may also be `null` for compatibility with the previous API. Invalid requests receive a `422 Unprocessable Entity` response.

The mock response is also parsed through a Zod schema when the application starts. This ensures its overall feedback, corrected text, and structured suggestions have the expected types before Express returns it.

## Source Structure

```text
src/
├── routes/
│   ├── health.ts
│   └── writing.ts
├── schemas/
│   └── writing.ts
├── app.test.ts
├── app.ts
└── server.ts
```

- `app.ts` configures Express, CORS, JSON parsing, and routers.
- `server.ts` starts the HTTP server.
- `routes/` contains endpoint handlers.
- `schemas/` contains Zod request and response schemas.
- `app.test.ts` verifies the public API contract.
