# TTS Throwdown

Day 14 build: a blind A/B benchmark for text-to-speech providers. Built with
Next.js and Turso.

## Features

- Blind A/B arena with locked voting until both clips are played
- Live leaderboard with Turso-backed votes
- On-demand TTS generation cached in Turso (local SQLite fallback)
- Providers: OpenAI, ElevenLabs, Inworld (Gemini wiring commented out)

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment

Copy `.env.example` to `.env.local` and fill in your keys.

Required for live TTS:

```
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
INWORLD_BASIC_AUTH=
```

Optional Turso config (falls back to `local.db` when unset):

```
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

Optional overrides (see `.env.example` for the full list):

```
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=alloy
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
INWORLD_TTS_MODEL=inworld-tts-1
INWORLD_TTS_VOICE=Dennis
```

`INWORLD_BASIC_AUTH` accepts either the raw base64 credential or a full
`Basic ...` header value.

## Customize

- Providers and prompts: `src/lib/bench-data.ts`
- TTS integrations: `src/lib/tts.ts`
- UI: `src/app/page.tsx`, `src/components/`

## License

MIT
