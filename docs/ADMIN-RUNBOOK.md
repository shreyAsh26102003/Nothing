# Nothing. — moderation and operations runbook

**Restricted operations only.** This repository is public: never paste participant contact information, bearer tokens, IP addresses, private competition decisions or service-role credentials into GitHub issues, commits or screenshots. Execute administrative SQL only in the authenticated Supabase dashboard.

## Daily operator check

1. Open the [private product pulse](https://supabase.com/dashboard/project/scgihelnwihjckzzvxyc/explorer/notebook/d58549e3-a177-40e2-ae60-ef64e135dcc9).
2. Check game starts, submitted scores, replay rate, referral visitors, claim failures, and unreviewed fraud flags.
3. Open the GitHub Actions **Game smoke tests** and **Nothing. production health** workflows. A failing workflow is an investigation, not proof of production failure.
4. Scan Supabase Edge Function logs for 4xx spikes, exception strings and slow API response volume. Use privacy-preserving aggregates.
5. Verify Vercel currently serves the intended deployment and the Edge Function is the matching version. The repo is **not automatically linked to Vercel**.
6. Do not approve prizes until there is a separate founder-approved competition and manual eligibility workflow.

## Score review

Use the Supabase SQL Editor. To inspect flags:

```sql
select f.id as flag_id,f.player_id,f.round_id,f.reason,f.severity,
       f.reviewed,f.created_at,s.display_name,s.score
from public.nothing_score_flags f
left join public.nothing_guest_scores s on s.player_id=f.player_id
where f.reviewed=false
order by f.created_at desc;
```

For a suspicious high score, inspect its round and exact event JSON; check the seed-generated trajectory, timing, repeat accounts and whether the player has unusually many games. The automated verifier is imperfect. A flag is **not** proof of cheating.

```sql
select r.id,r.started_at,r.claimed_at,r.score,r.duration,r.flagged,r.events
from public.nothing_rounds r
where r.player_id='<PLAYER_UUID>'::uuid
order by r.started_at desc limit 15;
```

Approve a flag only after reviewing evidence. Use a real UUID and flag ID; the placeholders intentionally will not execute unchanged.

```sql
begin;
update public.nothing_score_flags
set reviewed=true
where id=<FLAG_ID> and player_id='<PLAYER_UUID>'::uuid and reviewed=false;
insert into private.nothing_moderation_audit
(player_id,flag_id,action,reason,operator_label)
values('<PLAYER_UUID>'::uuid,<FLAG_ID>,'approve','Reviewed the recorded round and accepted it','<OPERATOR_NAME>');
commit;
```

Disqualify a player only after review and an approved policy decision. Disabling automatically removes them from the published leaderboard without erasing the original evidence:

```sql
begin;
update public.nothing_guest_players
set disabled=true
where id='<PLAYER_UUID>'::uuid;
insert into private.nothing_moderation_audit
(player_id,action,reason,operator_label)
values('<PLAYER_UUID>'::uuid,'disqualify','Document the evidence and policy basis','<OPERATOR_NAME>');
commit;
```

Undo a mistaken disqualification with `disabled=false` and a `restore` audit event. Always record the action. Never remove score evidence merely because a result is inconvenient.

## Ranking and identity

The public top 100 is the 100 highest-scoring **non-disabled, non-pending-severe-review** browser identities. Each guest has one retained best score. Equal scores are ordered by the original time the best score was achieved. A browser identity is **not one human being**; clearing data or using another device creates additional identities. Prize identity verification, if ever introduced, must happen separately.

## Participant requests

- Same-browser `privacy.html` can export recent records and delete the guest profile, its linked leaderboard scores, rounds, flags and opted-in email.
- Same-browser `updates.html` can unsubscribe an opted-in address. This does not establish cross-device identity.
- For a manual data-access/deletion request from another device, do not simply trust a typed name or email. Use a secure identity-control process approved by After All, then action the record in Supabase. Keep confirmation notes outside the public repository.
- On deletion, aggregate anonymous analytics may remain; do not claim every aggregate record was erased.

## Product email

The updates list stores unverified email addresses and explicit marketing consent separately. No email sender is configured. **Do not start sending campaigns until** a production provider, unsubscribe link, suppression handling, sender identity, deliverability checks, and legal approval are in place. Export only active consented records:

```sql
select email,created_at
from public.nothing_waitlist
where marketing_consent=true and unsubscribed_at is null
order by created_at desc;
```

Never export such records into public GitHub attachments.

## Incident response

**Site offline:** check Vercel deployment status, asset loading, content headers, and DNS only if domain is connected. Restore last known-good deployment through Vercel dashboard, then rerun health checks. Direct deployment uses a complete file list.

**Leaderboard unavailable:** check Supabase project health, Edge Function logs, `nothing_top_scores` RPC, table RLS and service-role environment. Do not disable RLS to fix an endpoint. Users can continue playing offline but those rounds cannot be retroactively ranked.

**Claim failures:** distinguish client network timeout, a stale guest token, a duplicate round submission, legitimate score-review holds and server validation mismatches. Do not arbitrarily insert a score without preserving an audit record.

**Bot/spam surge:** inspect account creation rates, IP-safe aggregates, round caps, event submission volume, and edge logs. If needed pause new registrations temporarily by a reviewed code change. Do not publish suspected users' personal details.

**Bad score on top 100:** place a documented review flag, disable if warranted, then investigate. Never silently erase winner disputes without evidence.

**Leaked credential:** rotate it in the provider dashboard, invalidate affected sessions or tokens where possible, and inspect exposure. Do not paste new secrets in chat or source.

## Monthly housekeeping

Refer to `ops/maintenance.sql`. Inspect stale sessions, old events and rates before any deletion. Avoid deleting contested score and prize records while reviews or legal holds are active. Set a formal retention policy with legal review before automated production cleanup.

## Handover permissions

A new operator needs Editor permissions to the GitHub repo, access to the existing Vercel project and a scoped Supabase account to view its project. Avoid sharing the project owner’s entire account and avoid embedding credentials in handover files. Separately approve who can disqualify entrants, export opt-in contacts, approve prize eligibility and touch DNS.
