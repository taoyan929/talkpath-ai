# TalkPath AI Backend

This folder contains the Node.js, Express, and TypeScript backend for TalkPath AI.

The backend includes a root endpoint, a health check, and a Writing Coach endpoint that can use either fixed mock feedback or Gemini.

## Requirements

- Node.js 18 or newer
- npm

## Install Dependencies

From the backend folder, run:

```bash
npm install
```

## Choose the Writing Feedback Provider

Copy the example environment file:

```bash
cp .env.example .env
```

The mock provider is the default and does not require an API key:

```env
WRITING_FEEDBACK_PROVIDER=mock
```

To use real Gemini feedback, update `.env`:

```env
WRITING_FEEDBACK_PROVIDER=gemini
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-3.5-flash
GEMINI_TIMEOUT_MS=15000
```

Keep `GEMINI_API_KEY` in the backend environment only. Never add the real key to `.env.example`, frontend files, or Git.

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
- `POST /api/writing/feedback`: validates writing input and returns mock or Gemini feedback

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
  "overall_feedback": "Your meaning is clear. Focus on the past tense and the article before the place.",
  "corrected_text": "I went to the supermarket yesterday.",
  "natural_version": "I went to the supermarket yesterday.",
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
  ],
  "key_phrases": [
    {
      "phrase": "went to",
      "meaning": "travelled to or visited a place",
      "example": "We went to the library after lunch."
    }
  ],
  "word_details": null
}
```

The request is validated with Zod. `text` must be a string containing between 1 and 5000 characters and cannot contain only whitespace. `goal` is an optional string; it may also be `null` for compatibility with the previous API. Invalid requests receive a `422 Unprocessable Entity` response.

Both providers return the same response shape. The mock response is parsed with Zod when the application starts. Gemini is asked for structured JSON, and its response is parsed and validated with the same Zod schema before Express returns it.

The response keeps necessary corrections in `corrected_text` and optional idiomatic phrasing in `natural_version`. It also returns distinct correction suggestions and up to three useful `key_phrases`.

When the trimmed input contains one English word, the provider switches to dictionary mode. In that mode, `word_details` contains the word, an IPA pronunciation, and one to three common meanings with parts of speech and example sentences. For normal writing input, `word_details` is `null`.

The small dataset in `src/evals/writing-feedback-cases.ts` contains quality cases for future prompt evaluation. Its automated test checks dataset coverage only and never calls Gemini.

## Source Structure

```text
src/
├── evals/
│   ├── writing-feedback-cases.test.ts
│   └── writing-feedback-cases.ts
├── middleware/
│   └── errors.ts
├── providers/
│   ├── gemini-writing.ts
│   └── writing-feedback.ts
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
- `providers/` selects mock or Gemini feedback and validates provider output.
- `routes/` contains endpoint handlers.
- `schemas/` contains Zod request and response schemas.
- Test files verify the public API contract, provider errors, and Gemini response parsing without making real Gemini requests.
