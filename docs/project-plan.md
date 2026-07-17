# TalkPath AI Project Plan

## 1. Project Overview

TalkPath AI is a full-stack AI English learning coach for real-world communication. It helps non-native English speakers practise practical English for daily life, workplace, study, and interview situations.

The goal is to build a clear, useful, and portfolio-ready application that demonstrates frontend development, backend API design, AI integration, and thoughtful product planning.

## 2. Problem Statement

Many English learners understand grammar rules but struggle to use English confidently in real situations. They may need help writing messages, preparing for interviews, responding at work, or practising conversations in a safe environment.

TalkPath AI aims to solve this by giving learners practical coaching, realistic scenarios, and simple feedback they can use immediately.

## 3. Target Users

- Non-native English speakers improving practical communication
- Students preparing for study or academic life in English
- Job seekers preparing for interviews and workplace communication
- Professionals who need clearer emails, messages, and responses
- Independent learners who want structured practice without a tutor

## 4. MVP Features

### Writing Coach

Helps users improve short pieces of writing by giving feedback on grammar, clarity, tone, and natural phrasing.

### Message Rewriter

Rewrites user messages for different situations, such as polite, professional, friendly, concise, or confident communication.

### Scenario Practice

Provides guided practice for real-world situations, including daily life, workplace, study, and interview scenarios.

### Basic Practice History

Stores a simple record of recent practice sessions so users can review what they worked on.

### Simple Dashboard

Shows key user activity, such as recent practice, completed scenarios, and basic progress indicators.

## 5. Non-MVP Features

These features are planned for later versions after the core AI experience is working well.

- RAG knowledge base for richer, context-aware coaching content
- Speaking practice with voice input and pronunciation feedback
- Personalised learning plan based on goals, level, and past practice
- Authentication for user accounts and saved progress
- Payment system for subscriptions or premium features

## 6. Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Node.js
- Express
- TypeScript
- Zod

### AI API

- Google Gemini API

### Database

- PostgreSQL, added after the core AI features are working

### Deployment

- Azure, planned for a later phase

### CI/CD

- GitHub Actions, planned for a later phase

## 7. Development Phases

### Phase 1: Project Setup

- Create the monorepo structure
- Add frontend, backend, and docs folders
- Write the README and project planning documents
- Choose consistent naming, formatting, and development conventions

### Phase 2: Frontend Prototype

- Build the main app layout
- Create pages or views for the dashboard, writing coach, message rewriter, and scenario practice
- Add simple forms and result displays
- Use mock data before connecting the backend

### Phase 3: Backend API Foundation

- Set up a Node.js and Express backend
- Create basic API routes for each MVP feature
- Add Zod schemas for request and response validation
- Prepare environment configuration for API keys

### Phase 4: AI Integration

- Connect the backend to the Google Gemini API
- Implement prompts for writing feedback, message rewriting, and scenario practice
- Return clear, structured responses to the frontend
- Add basic error handling for failed AI requests

### Phase 5: Practice History and Dashboard

- Add simple storage for recent practice sessions
- Connect practice history to the dashboard
- Keep the data model small and easy to understand
- Add PostgreSQL only after the core AI flows are stable

### Phase 6: Polish and Portfolio Preparation

- Improve UI styling and responsiveness
- Add helpful empty states and loading states
- Write setup instructions and usage notes
- Prepare screenshots, demo notes, and a short case study

## 8. Success Criteria

The MVP will be considered successful when users can:

- Submit writing and receive useful AI feedback
- Rewrite messages for different communication goals
- Practise common real-world English scenarios
- View recent practice history
- Understand their basic activity through a simple dashboard

From a technical perspective, the project should show:

- A clean full-stack structure
- Clear API boundaries between frontend and backend
- Practical AI integration
- Beginner-friendly code organization
- Documentation suitable for a professional portfolio

## 9. Portfolio Goals

TalkPath AI should demonstrate the ability to plan and build a realistic full-stack AI product. The project should be easy for recruiters, collaborators, or other developers to understand.

Portfolio goals include:

- Showing practical product thinking, not just technical implementation
- Demonstrating React, TypeScript, Express, and AI API integration
- Keeping the scope focused and achievable
- Writing clear documentation and development notes
- Building a project that can grow into a more advanced AI learning platform over time
