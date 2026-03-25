# Idea Generator

Sector-based innovation idea web app built with Next.js App Router.

## What it does

- Lets you pick a sector, region focus, and timeframe.
- Fetches recent sector signals from Google News RSS.
- Uses Gemini (when key is provided) to generate structured startup ideas.
- Falls back to heuristic ideas when Gemini key is missing or rate-limited.

## Quick start

1. Install dependencies:

```bash
npm install
```

1. Create local environment file:

```bash
copy .env.example .env.local
```

1. Add your keys in `.env.local` (Gemini optional, Firebase required for login):

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash

NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

1. In Firebase Console, enable authentication providers:
  - Email/Password
  - Google

1. Create Firestore database and keep a `users` collection available for user profile docs.

1. Run app:

```bash
npm run dev
```

1. Open <http://localhost:3000>

## API

- `POST /api/generate-ideas`

Request body:

```json
{
  "sector": "Healthcare",
  "region": "Global",
  "timeframeDays": 30
}
```

Response includes `ideas`, `signalsCount`, and metadata.

## Notes

- This MVP intentionally uses lightweight source ingestion (RSS) and single-route orchestration.
- For production, add stronger source diversity, caching, retry controls, and abuse throttling.
