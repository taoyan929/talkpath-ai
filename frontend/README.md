# TalkPath AI Frontend

This folder contains the React frontend for TalkPath AI.

The current frontend includes a Writing Coach form that sends text and an optional learning goal to the Express backend. It displays the corrected text, overall feedback, and structured writing suggestions returned by the API.

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
