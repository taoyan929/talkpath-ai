# TalkPath AI Frontend

This folder contains the React frontend for TalkPath AI.

The first frontend milestone is a simple full-stack communication check. The React app calls the Express backend health endpoint and displays the response.

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
```

You can change the backend URL by creating a `.env` file:

```bash
cp .env.example .env
```
