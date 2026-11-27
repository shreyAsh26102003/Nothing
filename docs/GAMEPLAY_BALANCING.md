# Gameplay design and balancing — current decisions
The priority is replayability, not cosmetic novelty.

## Fixed rules
45 seconds, three misses, slicing earns 10 points per fruit with +5 for hits in a combo. Bomb collision ends the game. The earlier emoji-like fruit appearance is retained because it tested better with the founder. Touch and desktop swipes must behave equivalently.

## Variable waves
The Edge Function deterministically generates wave seeds. Current phases: 0–7 seconds, 7–18, 18–30, 30–45. Fruit per wave increases beyond the opening; bomb incidence per wave rises from ~18% to ~52%. The exact realised values are random and depend on screen width.

Do not increase bomb probability on instinct alone. High difficulty can increase frustration and shorten replay rather than improve it.

## Current known weaknesses
- Late-game density and overlapping fruit/bomb patterns may feel unfair on small screens.
- Server geometric verification uses tolerance and does not prove a human swipe.
- In-app mobile browser viewport changes need specific device QA.
- The sound effects are synthesised, not custom professionally mastered sound design.
- Visual split frames are emoji halves masked with canvas rather than independent original sprite assets.

## Experiment plan
1. Establish baseline in 20–30 user beta (duration, replay, miss/bomb outcomes, first vs best score, self-reported fairness).
2. If early bomb losses dominate, lower early bomb chance or increase bomb separation.
3. If nearly everyone survives 45 seconds, increase late wave pressure or compress safe fruit gaps; do not change the miss limit.
4. If players report 'random death', improve bomb contrast and make swipe gesture collision feel deterministic.
5. Re-run the same checks; keep changes reversible in source control.

## Diagnostic benchmark
A hypothetical target is median duration ~20–35 seconds and ≥60% voluntary replay. This is a proposed design hypothesis, not evidence of current user behaviour. Use observed results to adjust; do not publish fabricated success statistics.
