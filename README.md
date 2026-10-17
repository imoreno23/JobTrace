# JobTrace

JobTrace is being moved from a browser-only prototype to a phone-friendly web app, following the setup pattern used for GridironOS: Next.js + TypeScript, Supabase Auth/Postgres, and Vercel hosting.

## Local setup

1. Install Node.js 20.9 or newer and pnpm.
2. Run `pnpm install`.
3. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from a Supabase project.
4. In Supabase Auth settings, set the local redirect URL to `http://localhost:3000/auth/callback`.
5. Run `pnpm dev` and open `http://localhost:3000`.

The current browser-only prototype remains at `/prototype/index.html`. Its data stays in that browser and does not sync to the signed-in app yet. Do not enter real customer data there.

## Phone access

After deployment to Vercel, open the deployed HTTPS URL on the phone and choose “Add to Home Screen” (iOS Safari) or “Install app” (Android Chrome). The app layout includes mobile viewport and safe-area settings. A deployed URL and Supabase project are needed before it can sign in and sync across devices.

## Deployment setup

Create a private GitHub repository, connect it to Vercel, and add the two Supabase environment variables in Vercel. Set `NEXT_PUBLIC_SITE_URL` to the deployed origin and add its `/auth/callback` URL to Supabase Auth redirect URLs. Pushes to the connected branch deploy through Vercel.
