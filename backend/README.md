# TalkPath AI Backend

This folder contains the initial FastAPI backend for TalkPath AI.

The backend currently includes a simple root endpoint and a health check endpoint. It does not include a database, authentication, or AI API integration yet.

## Create a Virtual Environment

From the backend folder, run:

```bash
python -m venv .venv
```

Activate the virtual environment:

```bash
source .venv/bin/activate
```

On Windows, use:

```bash
.venv\Scripts\activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Run the Backend Locally

```bash
uvicorn app.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

## Test the Health Endpoint

Open this URL in your browser:

```text
http://127.0.0.1:8000/api/health
```

Or test it with curl:

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

## API Endpoints

- `GET /`: returns a welcome message
- `GET /api/health`: returns the backend health status
