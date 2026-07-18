# TalkPath AI Frontend

This folder contains the React frontend for TalkPath AI.

The frontend provides two automatic learning modes:

- **Dictionary mode** handles one English word and displays pronunciation, meanings, parts of speech, and examples.
- **Writing feedback mode** handles sentences and longer text and displays overall feedback, corrected text, a natural version, suggestions, and key phrases.

The form also provides optional quick learning goals, copy actions, Retry, Start over, collapsible learning sections, and mode-specific loading states. No account is required, and work is not currently saved. Vocabulary saving and review are future features.

## Install Dependencies

```bash
npm install
```

## Run the Frontend Locally

```bash
npm run dev
```

The frontend will run at:

```text
http://127.0.0.1:5173
```

## Run Frontend Checks

```bash
npm test
npm run typecheck
npm run build
```

## Backend Requirement

Start the backend before testing the connection:

```bash
cd ../backend
npm install
npm run dev
```

The frontend calls:

```text
http://127.0.0.1:8000/api/health
http://127.0.0.1:8000/api/writing/feedback
```

You can change the backend URL by creating a `.env` file:

```bash
cp .env.example .env
```
