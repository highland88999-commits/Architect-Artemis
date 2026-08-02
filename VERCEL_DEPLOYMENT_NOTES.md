# Vercel deployment notes

## Files and folders that should stay out of Vercel deployments

The following are local-only or incompatible with Vercel and are now excluded by .vercelignore:

- engine/
- backend/
- frontend/
- creator-creation/
- memory/
- data/
- system-files/
- harvesting/
- incubator/
- tests/
- tools/
- scripts/
- generated/
- api/gemini/
- **/*.py
- requirements.txt
- requirements.lock.txt
- .env and .env.*

## Vercel-safe files that can remain for static hosting

- index.html
- assets/
- api/gateway.cjs
- api/gateway.js
- api/wake-engine.cjs
- api/wake-engine.js
- api/cron/*.js
- vercel.json
- .vercelignore

## Why these were excluded

- The repository contains a local Node/Python runtime stack that Vercel cannot execute as-is.
- The Python backend and local server files would either fail deployment or create build/runtime conflicts.
- The Next.js-style Gemini route under api/gemini is not suitable for this repo's current Vercel layout and was disabled from deployment.
