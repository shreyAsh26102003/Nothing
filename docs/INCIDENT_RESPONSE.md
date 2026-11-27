# Incident response — Nothing.
Use this runbook for site, leaderboard, fraud and privacy incidents.

## Severity
SEV1: site inaccessible, widespread wrong rankings, exposed credentials or personal data, active mass score fraud.
SEV2: score saving broken for a significant segment, repeated crashes, unacceptable latency, inaccurate mobile UI.
SEV3: isolated layout or animation error, non-critical metric/report delay.

## First 10 minutes
1. Confirm scope and time. Don't assume GitHub push equals live deployment.
2. Check Vercel deployment https://vercel.com/dashboard and GitHub **Nothing. production health** workflow.
3. Check the public health endpoint `.../nothing-game?action=health` and public leaderboard endpoint.
4. Check Supabase Edge Function logs and Postgres error logs. Never paste access tokens or emails into tickets.
5. For ranking incidents, preserve flagged rounds and hide suspicious scores via flags/disabled status; never manually fabricate standings.
6. For SEV1, restore previous known-good Vercel deployment or temporarily hide leaderboard claims until fixed. Post a concise public status note if users are impacted.

## Common scenarios
**Play button unresponsive:** Check `/app.js`, JS syntax/asset 404 and console errors; revert failed production deployment.

**Playing works but scores don't save:** Check API health, guest registration, round insertion, Edge Function logs, `nothing_commit_round` access. Consider API changes and production frontend compatibility.

**Score is 'review pending':** Inspect unreviewed flag in `nothing_score_flags`, original round events and physical plausibility. Record the decision. Do not override flags without evidence.

**Newsletter complaints:** Pause mail campaigns, inspect consent and unsubscribe records, honour removal requests. No production marketing emails should be sent from unverified opt-ins without appropriate provider configuration and legal review.

**Suspected credential/data exposure:** Revoke affected credentials, rotate secrets in platform dashboards, inspect historical deploys and logs, follow incident notification obligations. Do not commit replacements to Git.

## After-action review
Impact window, number of affected players, root cause, detection gap, temporary mitigation, durable fix, reproducible regression test, incident owner, deadline.
