# Nothing. — release acceptance checklist

Each item has three different states: **implemented**, **demonstrated**, and **approved**. A source commit or deployment alone does not prove acceptance.

## A. Quiet playable release (no prizes advertised)

- [x] Original emoji fruit set restored; no custom oddly shaped fruit renders.
- [x] 45-second rounds, three misses, bomb game-over, responsive server-generated waves.
- [x] Touch and mouse swipe input, streak scoring, sound toggle, effects, repeat play.
- [x] Minimal post-game score/replay/leaderboard/share experience.
- [x] Optional email-free leaderboard name claiming, saved best scores.
- [x] Supabase guest player, round, scoring, public top 100 and review flags.
- [x] Public privacy notice and separate optional product updates form.
- [x] Source-level tests and Chromium mobile smoke workflow committed.
- [x] At least one GitHub **Game smoke tests** workflow passed (27 November 2026, commit `fc06ae5`).
- [x] Vercel deployment previously reached READY.
- [x] Latest frontend assets deployed in Vercel production deployment `dpl_5Ro4xSJryPLpTUQfykEu2W3R9iQW` (READY); automated production asset and API checks green.
- [ ] Live Chromium test against deployed service in addition to local smoke simulation.
- [ ] Complete **real** iPhone Safari journey (play → claim → rank → relaunch → same rank).
- [ ] Complete **real** Android Chrome journey.
- [ ] WhatsApp and Instagram in-app browser journey.
- [ ] Two-device/rotation/replay interruption test and slow network/offline fallback test.
- [ ] No blocker bugs in a minimum 20-person private beta.
- [ ] Founder signs off on game difficulty and perceived enjoyment.

**Exit criterion:** the game works reliably without requiring an account/email, and the leaderboard accurately preserves scores for returning users on the same browser.

## B. Public distribution campaign

- [x] Challenge links carry a score target and a referral identifier.
- [x] Shareable downloadable PNG score card.
- [x] Native mobile sharing where available; clipboard fallback otherwise.
- [x] Social metadata and image for common link previews.
- [x] Anonymous visit/start/end/replay/share/referral events.
- [x] Private product pulse notebook and SQL reporting queries.
- [ ] Verify WhatsApp, Instagram, iMessage and desktop link-preview rendering.
- [ ] Verify attribution with real friend visits and nonzero referral conversions.
- [ ] Confirm reliable scheduled production health-check workflow and notification recipients.
- [ ] Agree on prelaunch copy, seeding volume and content calendar.
- [ ] Decide whether and when the optional product updates list is displayed.
- [ ] Configure production email sending and deliverability if emails are actually used.
- [ ] Legal/brand approval of privacy notice and outreach.
- [ ] Founder decides final date, dissemination plan and audience.

## C. Future rewards / top-100 competition

**Not eligible for public announcement until all unchecked items below are resolved.**

- [x] One best score per guest ID, deterministic seed, event/replay validation, atomic claims and basic abuse flags.
- [x] Severe unreviewed fraud flags excluded from the visible leaderboard.
- [x] Manual moderation audit trail and private review staging table.
- [ ] Independent review of practical cheating paths, including browser automation, replay forgery, multi-account abuse and account theft.
- [ ] Confirm winner identity and recovery flow that does not rely on unverifiable browser ownership.
- [ ] Publication and legal approval of competition terms: entry requirements, scoring, cutoffs, time limits, tie rules, disqualification, dispute process and reward eligibility.
- [ ] Decide how to verify, contact, and fulfil legitimate winners; keep details outside public repo.
- [ ] Decide treatment of users who lose their browser credential.
- [ ] Complete full prize-period rollback, moderation and incident-response rehearsal.
- [ ] Founder and legal sign-off before reward commitments.

## D. Engineering release process

- [x] Live Supabase project, schema, Edge Function and private analytics dashboard exist.
- [x] GitHub source and Vercel project exist.
- [x] GitHub Actions smoke test and browser regression test exist.
- [x] Site health-check script and scheduled workflow exist.
- [x] Administrator runbook, architecture handover and checklist.
- [ ] GitHub-to-Vercel automatic deployment: Vercel Git provider currently returned an authorisation error; owner must reconnect/access repo or choose direct deployments.
- [x] Current GitHub Actions workflow passes after latest source changes (27 November 2026).
- [ ] Confirm GitHub email/notification preferences actually deliver failures to an assigned operator; scheduled workflow itself exists and has passed.
- [ ] External backups / formal retention and restoration tested if production usage warrants them.
- [ ] Assign individuals responsible for game, infra, support, privacy and abuse review.
- [x] Record current deployment ID: `dpl_5Ro4xSJryPLpTUQfykEu2W3R9iQW` (Vercel READY); preserve prior deployment history for rollback.
- [ ] Founder-approved custom domain connection, **last**.

## Private beta protocol

Recruit 20–30 people from the intended audience, not exclusively friends who will be complimentary. Each tester should play **three rounds without coaching**, including at least five on iPhone and five on Android. Gather device/browser, first-run survival time, scores, any inability to save a score, the number of voluntary replays, whether bombs felt fair, and whether they would share the game unprompted. If multiple users report scoring bugs or arbitrary bomb hits, stop calling the game launch-ready and fix them.

**Proposed release thresholds, subject to founder approval:**
- Zero unresolved crashes or data-loss bugs from the beta.
- 100% of a targeted set of intentional save/reopen tests retain the same score/rank.
- At least 70% of testers play a second round voluntarily; otherwise investigate experience instead of adding unrelated features.
- Difficult enough to reward practice, not so frustrating that first-time users routinely end within a few seconds.

## Operational principle

Avoid declaring a feature complete solely because a function, screen or database table exists. Product acceptance requires live behavior, and user enjoyment requires human evidence. The domain remains explicitly out of scope until approval.

## Latest engineering verification (27 November 2026)

Production site health and GitHub smoke suites passed, including the separate headless Chromium flow. A disposable real-backend integration test passed register → start → three misses → submit zero-score round → profile → leaderboard → delete guest. The test uses a synthetic guest and does **not** establish winner identity or real-device performance. The custom domain remains unconnected.
