# Nothing. — After All

A browser-based fruit-slicing game by After All. Frontend: `index.html`; hosting: Vercel; ranking and score API: Supabase Edge Function `nothing-game`.

## Implemented
- 45-second round, 3 misses or a bomb ends the round.
- Five illustrated fruits (mango, strawberry, pineapple, banana, jamun), fruit halves, particles, combo scoring and generated sound.
- Mouse/touch input, local best, PNG score card and direct score-challenge links.
- Server-issued anonymous sessions, verified score submission API, global top 100 and player rank; one high score per verified player.
- Anonymous visit, start, replay, share and claim event tracking.

## Required before public leaderboard release
1. Supabase **Authentication → URL Configuration**: allow `https://nothing-after-all.vercel.app` as a redirect URL.
2. Supabase **Authentication → SMTP Settings**: configure custom SMTP (Resend, Postmark, etc.). The default sender rejects addresses outside the Supabase project team; unconfigured email delivery prevents public score claiming.
3. Test a complete verification and score submission using an address outside the team.
4. Test on real iPhone Safari, Android Chrome, and WhatsApp/Instagram in-app browsers.
5. Review top scores and challenge sophisticated fraud before announcing top-100 product rewards; current event verification is not fully cheat-proof.

## Privacy and security
Only a Supabase *publishable* key appears in the browser. Service-role secrets remain in Supabase functions. Marketing consent is optional and unchecked by default. Player profiles, gameplay sessions and analytics events are protected by RLS and have no browser access. The leaderboard exposes display names and public scores.

## Deployment and tests
Run `node --test test/smoke.mjs` for source smoke tests. Static files are currently deployed to Vercel via API. Automatic GitHub-to-Vercel deployment has not been connected. No custom domain has been configured. This repo is public.
