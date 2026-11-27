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
- Automated tests: `npm test`.

## Operational limitations — important before campaign launch
1. A guest identity is tied to **one browser's local storage**. Clearing storage or changing devices creates a new identity. This is deliberate to avoid the broken email-code flow, but it is not an account-recovery system.
2. Anti-cheat checks validate server-generated wave events, their positions and scoring, and allow flagging suspicious submissions, but are not cheat-proof. Before **any prizes** are awarded, define eligibility, verify finalists independently, review fraud flags, and publish competition rules.
3. Configure production email delivery and verified identity recovery **before** collecting winner addresses or announcing rewards. The preview's optional updates form currently records consent and an unverified email, and does **not** send confirmation mail.
4. Test on real iOS Safari, Android Chrome, WhatsApp and Instagram in-app browsers, and pilot with real players. Code smoke tests and simulations are not substitutes.
5. Vercel deploys are currently pushed through the API; the Vercel Git integration still needs access to the public GitHub repository for automatic deploy-on-push. Avoid assuming GitHub commits update the live site.
6. Custom `becauseafterall.com` domain has **not** been connected. Repository is public.

## Maintaining the game
Do not expose service credentials in browser code, version control, or screenshots. Use Supabase SQL Editor for administrative reports, including suspicious scores. Review prize records only in the private schema. Preserve three misses unless the product owner changes the rule.
