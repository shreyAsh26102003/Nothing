-- NOTHING. DATA MAINTENANCE — READ-ONLY BY DEFAULT.
-- Do not delete records until an approved retention schedule exists.
-- Prize disputes/legal holds override ordinary deletion decisions.

-- Unclaimed expired rounds older than seven days
select count(*) as expired_unclaimed
from public.nothing_rounds
where claimed_at is null and expires_at<now()-interval '7 days';

-- Anonymous events older than ninety days
select count(*) as events_over_90_days
from public.nothing_events where created_at<now()-interval '90 days';

-- Per-hour rate-limit counters older than seven days
select count(*) as old_hour_buckets
from private.nothing_api_rate
where bucket<now()-interval '7 days';

-- Stored leaderboard records for disabled guest accounts
select count(*) as disabled_player_scores
from public.nothing_guest_scores s
join public.nothing_guest_players p on p.id=s.player_id
where p.disabled=true;

-- Prize review or moderation holds: these records require cautious preservation.
select (select count(*) from public.nothing_score_flags where reviewed=false) as pending_flags,
       (select count(*) from private.nothing_reward_review where status in ('pending','needs-verification')) as pending_rewards;

-- Once approved by counsel/operator, a maintainer may delete stale UNCLAIMED
-- expired rounds, old rate-limit buckets, and old anonymous telemetry.
-- Never run destructive maintenance on an unreviewed leaderboard incident.
-- Example only; disabled until a retention policy is signed:
-- begin;
-- delete from public.nothing_rounds
-- where claimed_at is null and expires_at<now()-interval '30 days';
-- delete from private.nothing_api_rate
-- where bucket<now()-interval '30 days';
-- commit;

-- Restore procedure: use a verified Supabase point-in-time recovery or backup,
-- test in a non-production environment, and verify player/score counts before
-- cutting over. Database backups/point-in-time recovery depend on plan features;
-- confirm actual entitlement and tested recovery rather than assuming availability.
