# TalkPath AI

**AI English Learning Coach for Real-World Communication**

## Overview

TalkPath AI is a full-stack portfolio project for an AI-powered English learning coach. The app is designed to help learners practice practical communication skills through guided conversation, pronunciation support, personalized feedback, and goal-based learning paths.

The current MVP focuses on one complete learning flow: users can look up a single English word or submit sentences and short messages for structured Gemini feedback.

## Target Users

- English learners preparing for real-world conversations
- Professionals improving workplace communication
- Students practicing speaking, listening, and vocabulary
- Immigrants, travelers, and job seekers who need practical English confidence
- Independent learners who want structured feedback outside a classroom

## Current MVP Features

- **Dictionary mode:** a single English word returns pronunciation, simple meanings, parts of speech, and examples
- **Writing feedback mode:** sentences and longer text return overall feedback, corrections, a natural version, suggestions, and key phrases
- Optional free-text learning goals and quick goal choices
- Copy actions, collapsible learning sections, Retry, Start over, and mode-specific loading states
- No account is required and submitted work is not currently saved

Saving vocabulary, reviewing learned words, accounts, practice history, speech features, and progress tracking are future features.

## Tech Stack

- **Frontend:** React, Vite, and TypeScript
- **Backend:** Node.js, Express, and TypeScript
- **API Validation:** Zod
- **AI:** Google Gemini API for writing coaching and feedback
- **Styling:** Plain CSS

The MVP does not currently use a database or authentication.

## macOS Local Launcher

The local launcher starts the existing Express backend and Vite frontend together, waits for them to become ready, and opens `http://localhost:5173` in your default browser. Node.js and npm must already be installed. If you use nvm, the launcher will try to load your existing `~/.nvm/nvm.sh` when Finder does not provide Node.js on `PATH`.

### First-Time Setup

From the project root, install both sets of dependencies if needed:

```bash
cd backend
npm install
cd ../frontend
npm install
cd ..
```

Create the local backend environment file if it does not already exist:

```bash
cp backend/.env.example backend/.env
```

Add your Gemini configuration to `backend/.env`. This file remains local and is ignored by Git; the launcher checks that it exists but never prints its contents.

Make the launcher files executable once:

```bash
chmod +x "TalkPath AI.command" scripts/start-talkpath-local.sh scripts/stop-talkpath-local.sh
```

### Start by Double-Clicking

In Finder, open the project folder and double-click `TalkPath AI.command`. A Terminal window stays open while the backend and frontend are running. Closing that window or pressing `Control-C` stops both launcher-managed services.

The launcher refuses to start duplicates if port 8000 or 5173 is already occupied. It does not stop processes that were started manually or by another application.

### Stop from Another Terminal

You can also stop services started by the launcher with:

```bash
./scripts/stop-talkpath-local.sh
```

Local logs and PID files are written to `.talkpath-local/`. The folder is ignored by Git and does not contain the Gemini API key.

### If macOS Blocks the Launcher

If macOS says the file cannot be opened, right-click `TalkPath AI.command`, choose **Open**, then confirm **Open**. You can also check **System Settings → Privacy & Security** for an **Open Anyway** option.

If the file was downloaded and you trust this project copy, you can remove only its quarantine attribute:

```bash
xattr -d com.apple.quarantine "TalkPath AI.command"
```

## Development Roadmap

### Phase 1: Project Foundation

- Set up the monorepo structure
- Define frontend, backend, and documentation folders
- Add project README and development standards
- Choose final framework and package manager

### Phase 2: Core Application Shell

- Build the initial frontend layout
- Create backend health check and API structure
- Add shared environment configuration
- Prepare database schema planning

### Phase 3: MVP Learning Flow

- Implement user profile and learning goals
- Add scenario-based conversation practice
- Integrate AI feedback for grammar, vocabulary, and clarity
- Store basic practice history

### Phase 4: Speech and Progress Features

- Add voice input support
- Provide pronunciation and fluency feedback
- Build a progress dashboard
- Generate personalized next-step recommendations

### Phase 5: Portfolio Polish

- Improve UX and visual design
- Add sample demo data
- Write setup and deployment documentation
- Prepare a public demo and case study
