# Nothing. — engineering and operations handover

**Status:** private-preview / unannounced. **Owner:** After All. **Date:** 27 November 2026.

## Canonical locations

| Resource | Location | Purpose |
|---|---|---|
| Source | https://github.com/shreyAsh26102003/Nothing | Public code and GitHub Actions |
| Preview | https://nothing-after-all.vercel.app | Current user-facing game |
| Vercel | Team `shreyash26102003s-projects`, project `nothing-after-all` | Hosting |
| Supabase | Project `scgihelnwihjckzzvxyc` | Data, game sessions, leaderboard and APIs |
| API | `https://scgihelnwihjckzzvxyc.supabase.co/functions/v1/nothing-game` | Game actions |
| Product pulse | [Supabase private dashboard](https://supabase.com/dashboard/project/scgihelnwihjckzzvxyc/explorer/notebook/d58549e3-a177-40e2-ae60-ef64e135dcc9) | Activity, scores and reviews |

**Custom domain is deliberately not connected.** Do not add `nothing.becauseafterall.com` without explicit founder approval.

## Architecture

```text
Browser index.html + styles.css + app.js
  ├── play immediately, even with temporary API unavailability (offline scores are not ranked)
  ├── guest player token in same-browser localStorage (never transmitted in URL)
  ├── POST register → random bearer token, hashed in database
  ├── POST start → server seeds responsive wave geometry and creates a round
  ├── POST submit → validates timing, score, fruit positions and swipe traces
  ├── GET profile / leaderboard → browser personal best and global ranking
  ├── POST track → anonymous event metrics and referral attribution
  └── optional /updates.html → separately consented, unverified contact
Supabase Edge Function
  └── PostgreSQL RLS tables + least-privilege administrative RPC functions
```

The browser never receives a Supabase service-role key. Edge Function runs with the service role. **Do not put service-role keys, SMTP passwords, user contact lists, admin exports or private competition details into the public repository.**

## User journey

1. Arrive at game; browser assigns an anonymous visit ID.
2. Tap **PLAY NOTHING.**; guest credential and server round are created.
3. Countdown runs, then a 45-second game begins. Three missed fruit or one bomb ends it.
4. On completion, users see score, replay, leaderboard and challenge actions.
5. Open leaderboard. New player enters a display name and saves the eligible round. Returning players with an existing name attempt automatic submission.
6. Verified score and server-determined rank remain attached to the same browser identity. Browser storage deletion, private browsing and switching devices can lose that identity.
7. Optional product updates are in a separate form and require affirmative consent; this list has **unverified email addresses** and must not serve as winner identity proof.

## Deploying and rollback

**Current limitation:** the Vercel Git integration is not connected to this repo (Git namespace permission error). GitHub commits **do not** update the live Vercel deployment automatically. A source update requires direct deployment of **all** user-facing files (`index.html`, `styles.css`, `app.js`, `updates.html`, `privacy.html`, `social-card.svg`, `favicon.svg`, `robots.txt`, `api/leaderboard.js`) to the existing Vercel project. Never deploy only `index.html` or leave out `app.js`.

A maintainer can reconnect in Vercel → Project → Settings → Git after authorising the GitHub repository in the Vercel Git integration. Once connected, set main as production branch, ensure there is no unexpected framework/build command, then verify automatic builds against the smoke tests. Do not create a duplicate project merely to make Git linking work.

A safe release sequence:
1. Commit and review the exact changes in GitHub.
2. Check GitHub Actions **Game smoke tests** are passing, including real Chromium test.
3. If changing Supabase SQL, apply migration and validate it via a read/query or rolled-back transaction.
4. If changing the Edge Function, deploy it and verify health and leaderboard.
5. Deploy complete frontend to existing project, check Vercel READY, and check site/API/asset URLs.
6. Run the health-check script and repeat the full score-submit journey before making a major announcement.
7. If production fails, restore the last known-good Vercel deployment (via Vercel dashboard rollback/promote) and revert any incompatible Edge Function; review schema compatibility before rolling back database writes.

No Vercel deployment guarantees that gameplay or email works in a real browser; release gates remain separate.

## Tests and monitoring

- `npm test`: quick game and source regression checks.
- `npm run test:browser`: local Chromium mobile UI flow; requires Chromium/Chrome.
- `node scripts/health-check.mjs`: deployed HTML, scripts, CSS, privacy, updates, API health and leaderboard reachability.
- GitHub Actions: `Game smoke tests` on pushes; `Nothing. production health` daily and on main pushes. Set repository notification preferences for failed runs, or configure an independent alerting recipient.
- Supabase private notebook: engagement, scores, referrals, review queue.
- The unannounced site has `noindex` and `robots.txt` disallow; this discourages indexing but **does not provide access control**.

## Database inventory

- `nothing_guest_players` — hashed guest tokens and display names, not emails.
- `nothing_rounds` — server seeds, dimensions, scores, replay events and fraud flags.
- `nothing_guest_scores` — one best score per guest.
- `nothing_score_flags` — manual-review reasons; severe unreviewed flags hide accounts from public top 100.
- `nothing_events` — anonymous visit and product metrics, including referral ID.
- `nothing_waitlist` — separately consented email list, unsubscribe status and no verified-email guarantee.
- `private.nothing_reward_review` — optional internal reward eligibility staging, not part of public API.
- `nothing_players`, `nothing_sessions`, `nothing_scores` — **legacy unused early-prototype tables**. Do not drop without confirming they have no outstanding data/dependencies.
- `private.nothing_api_rate` — server rate-limiting counters.

Public tables have RLS enabled; most tables expose no anon/authenticated client grants. RLS-no-policy advisories for intentionally inaccessible server-only tables are expected. Review other Supabase security advisories separately.

## Security caveats

Replay checks verify fruit/bomb positions, swipe geometry, time order and score arithmetic, and hold some unusually high submissions for review. **They are not cheat-proof.** An attacker who reverse-engineers browser gameplay can submit plausible events. Do not promise rewards on the basis of automated ranking alone. Review finalist records, multiple guest identities, abnormal rates and contest rules.

Guest identity is intentionally tied to browser localStorage. Do not represent it as secure real-world identity; a user can generate multiple guest accounts.

## Privacy and operations

- `privacy.html` offers the same-browser player a recent-data export (latest 100 rounds) and account deletion. For broader requests, coordinate a manual access/deletion process with authorised operators.
- `updates.html` offers same-browser unsubscribe. Product emails are **not** currently sent, and stored emails are unverified.
- Keep contact exports private; never publish real participant emails, tokens, IP addresses, review notes or partner addresses.
- Use `ops/reports.sql` for manual metrics, and see `docs/ADMIN-RUNBOOK.md` for moderation.

## Release blockers

Refer to `docs/RELEASE-CHECKLIST.md`. Real iOS/Android/in-app testing, human gameplay beta, winner identity verification, legal sign-off and external email service access require others. These cannot be marked done from code changes alone.
