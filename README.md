# MindEase — Mental Wellness Tracker for Students

MindEase is a production-grade Generative AI-powered Mental Wellness Tracker designed specifically for Indian students preparing for high-stakes competitive exams (NEET, JEE, CUET, CAT, GATE, UPSC).

## Features

- **Daily Open-Ended Journaling**: Log entries and receive GenAI-powered analysis to uncover hidden stress patterns and get actionable coping strategies.
- **Mood Tracking**: Log mood scores and emotions to track 7-day patterns, identify top stressors, and see trends over time.
- **AI Companion**: A hyper-personalised, empathetic conversational AI that understands the pressures of Indian exam prep.
- **Adaptive Mindfulness**: Generates real-time, step-by-step breathing and mindfulness exercises based on your current emotional state.
- **Privacy First**: All journal entries are AES-256-GCM encrypted at rest on the server.
- **Safety Net**: Automated crisis detection scans inputs and AI responses for signs of severe distress and displays helpline information (iCall).

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict mode)
- **AI**: Google Gemini 2.5 Flash API (Server-side proxying only)
- **Database**: SQLite (via pure JS `sql.js` for environment compatibility)
- **Styling**: Vanilla CSS (Premium dark-mode glassmorphism, fully WCAG AA accessible)

## Security & Architecture

- **Encryption**: AES-256-GCM for sensitive data at rest.
- **Rate Limiting**: Sliding window rate limiting on all API routes to prevent abuse.
- **Input Sanitisation**: Strict stripping of XSS, HTML, SQL injections, and prompt injections.
- **Streaming**: AI Companion utilizes Server-Sent Events (SSE) for real-time typing experiences.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the root based on `.env.example`:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ENCRYPTION_KEY=your_32_byte_hex_key_here
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## Testing

Run unit tests covering utility, security, and validation logic:
```bash
npm run test
```
