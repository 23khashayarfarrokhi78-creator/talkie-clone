# Talkie Clone - Personal AI Character Chat App

A mobile-first AI character chat application inspired by [Talkie](https://www.talkie-ai.com/), built for personal use.

## Features

- **AI Character Chat** — Text-based conversations with AI characters (with conversation memory)
- **Character Creation** — Create custom characters with personality, appearance, and greeting messages
- **Character Discovery** — Browse characters by category (Companion, Helper, Anime, Fiction, Fun)
- **Voice Chat** — Speech-to-text input and text-to-speech output using Web Speech APIs
- **Mobile-First PWA** — Installable on mobile devices, optimized for touch interactions
- **Dark Theme** — Beautiful dark UI inspired by Talkie's design
- **6 Default Characters** — Luna, Kai, Dr. Sage, Mika, Shadow, Chef Rosa

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS (Vite, PWA)
- **Backend:** FastAPI (Python)
- **Database:** SQLite with SQLAlchemy (async)
- **AI:** Google Gemini API (free tier) with fallback responses
- **Voice:** Web Speech API (browser-native)

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## AI Configuration

The app works out of the box with scripted fallback responses. To enable real AI chat:

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Set the environment variable: `GEMINI_API_KEY=your-key-here` in `backend/.env`
3. Restart the backend

Or enter the key in the app's Settings page.

## Deployment

- **Frontend:** Deployed to devinapps.com (static hosting)
- **Backend:** Deployed to Fly.io with persistent volume for SQLite database
