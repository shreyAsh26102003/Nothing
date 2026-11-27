# Nothing. — After All

Playable fruit-slicing game, hosted separately from becauseafterall.com.

## Current experience
- 45 seconds and **three misses**. Hit a bomb and the round ends.
- Original emoji-style mango, strawberry, pineapple, banana and grape fruit (restored on user feedback).
- Variable, server-generated waves (2–5 fruit per wave), larger bomb pressure after the opening moments, combo bonuses, particles, split animations, swipe trail, generated sound and vibration where supported.
- Full-screen game; deliberately minimal results screen with score, replay, leaderboard and sharing.
- Shareable personal score cards and score-challenge URLs with referral tracking.
- **No email verification required** to join the leaderboard. A guest player credential is stored locally in the browser. The best verified round score per guest appears in the global ranking; rank and cutoff are available through the API.
- Separate optional `/updates.html` form for unverified, opt-in product email updates, and `/privacy.html` information.

## Architecture
- Frontend: `index.html`, `styles.css`, `app.js`
- Data and ranking: Supabase Edge Function `nothing-game` at `supabase/functions/nothing-game/index.ts`
- Database: `nothing_guest_players`, `nothing_rounds`, `nothing_guest_scores`, `nothing_score_flags`, `nothing_events`, `nothing_waitlist` and private `nothing_reward_review`.
- All personally identifying contact details and game secrets remain server-side. Browser stores a pseudonymous guest token, not a secret Supabase service-role key. Email list entries are unverified and must **not** be used as proof of identity.
- Analytics and review queries: `ops/reports.sql`.
- Automated tests: `npm test` plus `node test/browser.mjs` (Chromium). Both run in the GitHub Actions smoke workflow; failures attempt to upload a browser screenshot.

## Operational limitations — important before campaign launch
1. A guest identity is tied to **one browser's local storage**. Clearing storage or changing devices creates a new identity. This is deliberate to avoid the broken email-code flow, but it is not an account-recovery system.
2. Anti-cheat checks validate server-generated wave events, their positions and scoring, atomically claim rounds and withhold suspicious scores from the visible leaderboard until manual review. Anonymous-account creation is rate-limited when a trusted client IP is available. These checks are not cheat-proof. Before **any prizes** are awarded, define eligibility, verify finalists independently, review fraud flags, and publish competition rules.
3. Configure production email delivery and verified identity recovery **before** collecting winner addresses or announcing rewards. The preview's optional updates form currently records consent and an unverified email, and does **not** send confirmation mail.
4. Test on real iOS Safari, Android Chrome, WhatsApp and Instagram in-app browsers, and pilot with real players. Automated headless Chromium tests are not substitutes for these devices or game-feel testing.
5. Vercel deploys are currently pushed through the API; the Vercel Git integration still needs access to the public GitHub repository for automatic deploy-on-push. Avoid assuming GitHub commits update the live site.
6. Custom `becauseafterall.com` domain has **not** been connected. Repository is public.

## Handover documentation

- **[Complete handover](docs/HANDOVER.md)** — architecture, live links, deployment, operations, data and known blockers.
- **[Release checklist](docs/RELEASE-CHECKLIST.md)** — requirements for quiet preview, distribution and prize competition.
- **[Admin and moderation](docs/ADMIN-RUNBOOK.md)** — secure score review and fraud-response actions.
- **[Gameplay tuning](docs/GAMEPLAY_BALANCING.md)** and **[beta test kit](docs/BETA_TEST.md)**.
- **[Launch messaging](docs/LAUNCH_COPY.md)** and **[competition rules draft](docs/COMPETITION_RULES_DRAFT.md)**.
- **[Incident response](docs/INCIDENT_RESPONSE.md)**; SQL reports in `ops/reports.sql`, safe admin queries in `ops/admin.sql`, maintenance review in `ops/maintenance.sql`.
- **Live integration test:** `npm run test:live` registers a disposable test player, finishes a round, saves and reads the score, then deletes the test player. Requires network and modifies/deletes temporary test data. GitHub has a manually invokable workflow for this.

## Verified live integration

On 27 November 2026, the live round-to-leaderboard test passed in GitHub Actions after fixing a real guest-registration 500 error. The test confirmed register, start, 3 missed fruits, score submit, profile, public leaderboard and disposable-player cleanup.

## Maintaining the game
Do not expose service credentials in browser code, version control, or screenshots. Use Supabase SQL Editor for administrative reports, including suspicious scores. Review prize records only in the private schema. Preserve three misses unless the product owner changes the rule.

## Private analytics
The Supabase project contains a shared internal notebook named **Nothing — Daily Product Pulse** for acquisition, engagement, referrals, scores and unreviewed fraud reports. Never expose its user/contact tables through a public dashboard.
