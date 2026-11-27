# Private beta — operator kit
**Purpose:** Verify the game's feel and end-to-end competition loop before a public reward announcement.

## Sample
20–30 people, ideally balanced: 8–10 iPhone users, 8–10 Android users, 4–6 desktop users. At least five should open the link from WhatsApp or Instagram in-app browsers. Do not promise product or prizes yet.

## Script (under 8 minutes)
1. Share a Nothing. challenge URL. Ask the player to open it without coaching.
2. Ask them to play three rounds. Do not mention scoring tactics.
3. After their first run, ask them to save a leaderboard name and find their rank.
4. Ask them to close/reopen the tab and check whether score and rank persist.
5. Ask them to share a challenge; recipient verifies that the target score is visible.
6. Ask them to toggle sound, background the app mid-round, and replay.
7. Record device model, OS, browser, whether the link opened in-app, first score, highest score, game duration, bugs, and free-text reactions.

## Data columns
tester_id (not real name); device; OS; browser; network; source link; first_game_score; highest_score; rounds_completed; first_round_seconds; signed_in? (should be no); score_claim_success?; rank_matches?; challenge_share_success?; second_visit_retains_score?; crash?; score_1_to_5_fun; frustration_1_to_5; play_again_without_incentive?; would_share_with_friend?; issue_description.

## Decision criteria (proposed, not yet measured)
- ≥95% complete a first game without crash, stuck screen or unreadable UI.
- ≥90% of attempted eligible submissions result in a persistent score/rank.
- At least 60% voluntarily begin a second round.
- Median enjoyment ≥4/5 and no systematic dissatisfaction with unfair bomb placement.
- No reproducible discrepancy between the score in the end screen and server-verified score.
- No critical data-loss or privacy issue.

These thresholds are initial quality gates, not estimates of how players will behave.

## Gameplay tuning
Compute per phase: fruit hit %, bomb hit %, missed fruits, elapsed seconds, typical score, average rounds per person, 50th/90th percentile. Observe where players quit. If most games end before 7 seconds, early difficulty is punitive. If most last 45 seconds with low bombs, difficulty is trivial. Tune **one** variable at a time (density, wave interval, bomb probability, spacing), keep the same sample composition, and repeat.

## Research prompts
- 'What was confusing in the first ten seconds?'
- 'When did you realise the bombs were dangerous?'
- 'Did you feel the game was unfair at any point?'
- 'What made you play again—or stop?'
- 'Would you share your score if nobody was watching?'

## Report format
Executive verdict; test cohort; measured funnel; device bugs; top 5 player quotes; recommended tuning; go/no-go decisions; evidence links and owners.
