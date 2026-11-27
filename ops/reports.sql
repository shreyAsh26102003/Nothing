-- Run in Supabase SQL Editor with project administrator access.
-- This file contains operational queries, NOT user data or credentials.

-- Daily acquisition and engagement.
select date_trunc('day',created_at) as day,
 count(distinct anonymous_id) filter(where event_name='visit') as visitors,
 count(distinct anonymous_id) filter(where event_name='started') as players,
 count(*) filter(where event_name='started') as rounds_started,
 count(*) filter(where event_name='ended') as rounds_finished,
 count(*) filter(where event_name='replayed') as replays,
 count(*) filter(where event_name='shared') as shares,
 count(*) filter(where event_name='claim_verified') as score_claims
from public.nothing_events
where created_at >= now()-interval '30 days'
group by 1 order by 1 desc;

-- Leaderboard and score distribution (submitted scores only).
select count(*) as players,
 round(avg(score),1) as average_best,
 percentile_cont(.5) within group(order by score) as median_best,
 percentile_cont(.9) within group(order by score) as p90_best,
 max(score) as highest
from public.nothing_guest_scores;

-- Top 100 excluding disabled users.
select rank() over(order by s.score desc,s.achieved_at asc) as rank,
 s.display_name,s.score,s.achieved_at,s.player_id
from public.nothing_guest_scores s
join public.nothing_guest_players p on p.id=s.player_id
where p.disabled=false
order by s.score desc,s.achieved_at asc limit 100;

-- Recent suspicious submissions: review before any reward eligibility decision.
select f.id,f.created_at,f.reason,f.severity,f.reviewed,
       s.display_name,s.score,s.player_id,f.round_id
from public.nothing_score_flags f
left join public.nothing_guest_scores s on s.player_id=f.player_id
where f.reviewed=false order by f.created_at desc limit 100;

-- Visitors from referrals and resulting game starts.
select referrer_id,
 count(distinct anonymous_id) filter(where event_name='visit') as referral_visitors,
 count(distinct anonymous_id) filter(where event_name='started') as referral_players,
 count(*) filter(where event_name='claim_verified') as score_claims
from public.nothing_events
where referrer_id is not null
group by referrer_id order by referral_visitors desc limit 100;

-- Event anomalies; review spikes, failures, incomplete play.
select date_trunc('hour',created_at) as hour,event_name,count(*) as events
from public.nothing_events
where created_at >= now()-interval '7 days'
group by 1,2 order by 1 desc,2;

-- Current separate optional updates list; all addresses are unverified.
select email,marketing_consent,verified,created_at
from public.nothing_waitlist where marketing_consent=true and verified=true
order by created_at desc;

-- Reward records are PRIVATE, and should only be populated after competition rules
-- and independent identity verification are approved.
-- Example review action, using an actual reviewed player UUID:
-- insert into private.nothing_reward_review(player_id,status,reviewer_notes)
-- values ('<verified-player-uuid>','needs-verification','Pending contact confirmation')
-- on conflict(player_id) do update set status=excluded.status,
-- reviewer_notes=excluded.reviewer_notes,reviewed_at=now();
