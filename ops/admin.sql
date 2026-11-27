-- NOTHING. OPERATOR SQL — for authenticated Supabase SQL Editor only.
-- All writes below are templates with deliberate placeholders. They will not execute unchanged.
-- Do not paste real participant contact info into GitHub or chat logs.

-- 1. Current top 100 (excludes disabled or pending severe reviews).
select row_number() over(order by score desc,achieved_at asc) as place,
       player_id,display_name,score,achieved_at
from public.nothing_top_scores(100);

-- 2. Fraud-review inbox.
select f.id as flag_id,f.created_at,f.player_id,f.round_id,
       f.reason,f.severity,f.reviewed,s.display_name,s.score
from public.nothing_score_flags f
left join public.nothing_guest_scores s on s.player_id=f.player_id
where f.reviewed=false
order by f.severity desc,f.created_at asc
limit 100;

-- 3. Look at the gameplay evidence for ONE player.
-- Replace the placeholder before running.
-- select id,started_at,claimed_at,seed,viewport_width,viewport_height,
--        score,duration,flagged,events
-- from public.nothing_rounds
-- where player_id='<REAL_PLAYER_UUID>'::uuid
-- order by started_at desc limit 25;

-- 4. Mark a flag reviewed only after inspecting evidence and noting why.
-- Use a transaction, with real flag and player IDs. Audit action precedes COMMIT.
-- begin;
-- update public.nothing_score_flags set reviewed=true
-- where id=<REAL_FLAG_ID> and player_id='<REAL_PLAYER_UUID>'::uuid
--   and reviewed=false;
-- insert into private.nothing_moderation_audit
--   (player_id,flag_id,action,reason,operator_label)
-- values('<REAL_PLAYER_UUID>'::uuid,<REAL_FLAG_ID>,'approve',
-- 'Evidence reviewed; no rule violation found','<REAL_OPERATOR>');
-- commit;

-- 5. Disqualify only under published rules and preserve underlying evidence.
-- begin;
-- update public.nothing_guest_players set disabled=true
-- where id='<REAL_PLAYER_UUID>'::uuid;
-- insert into private.nothing_moderation_audit
-- (player_id,action,reason,operator_label)
-- values('<REAL_PLAYER_UUID>'::uuid,'disqualify',
--        'Reason under approved competition policy','<REAL_OPERATOR>');
-- commit;

-- 6. Restore a mistakenly disqualified player.
-- begin;
-- update public.nothing_guest_players set disabled=false
-- where id='<REAL_PLAYER_UUID>'::uuid;
-- insert into private.nothing_moderation_audit
-- (player_id,action,reason,operator_label)
-- values('<REAL_PLAYER_UUID>'::uuid,'restore',
--        'Reviewer corrected earlier decision','<REAL_OPERATOR>');
-- commit;

-- 7. Provisional top-100 list for PRIVATE contact verification.
-- Do not publish player IDs as proof of real identity.
select * from public.nothing_top_scores(100);

-- 8. Internal reward review staging — only after competition approval.
select r.player_id,r.status,r.reviewed_at,r.reviewer_notes
from private.nothing_reward_review r
order by r.created_at desc limit 200;

-- 9. Marketing opt-in list — internal and unverified.
-- Do not initiate outbound messaging without provider, verified consent,
-- unsubscribe, suppression and legal review.
select email,created_at from public.nothing_waitlist
where marketing_consent=true and verified=true and unsubscribed_at is null
order by created_at desc;

-- 10. Check that every table in exposed schemas has RLS.
select n.nspname as schema_name,c.relname as table_name,c.relrowsecurity as rls
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public') and c.relkind in ('r','p')
and c.relname like 'nothing_%' order by c.relname;
