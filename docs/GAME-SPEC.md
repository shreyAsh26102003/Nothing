# Nothing. — game specification

The product is a small, addictive fruit-slicing game for After All, not an email gate or a health-brand campaign. Preserve the founder-approved original emoji-style fruits and uncluttered results screen.

## Current rules
- Play for up to **45 seconds**. One bomb sliced or three missed fruits ends the round.
- **10 points** per fruit; **+5** for each additional fruit sliced within 180ms of the previous hit.
- Mouse/touch swipes require **at least 12px** movement. Tap alone does not score.
- Server-issued waves/physics govern ranked rounds. If the backend is unavailable, local play remains possible but the score is not eligible for rankings.
- A guest browser credential can claim a score with a display name, without supplying an email address. Only the personal best is ranked. Clearing browser storage loses recovery access.
- Shareable challenge URL includes score and referral ID. Post-game actions are Play Again, Leaderboard, Challenge a Friend, Save Score Card.

## Initial tuning parameters (NOT validated with real players)

| Elapsed time | Base spacing (+0–0.4s jitter) | Objects/wave | One-bomb chance/wave |
|---|---|---|---|
| 0–7 s | 1.22 s | 2–3 | 18% |
| 7–18 s | 1.02 s | Mobile 3–4, desktop 3–5 | 31% |
| 18–30 s | 0.82 s | Mobile 3–4, desktop 3–5 | 43% |
| 30–45 s | 0.70 s | Mobile 3–4, desktop 3–5 | 52% |

Bomb probability is per wave, **not per individual fruit**. Each wave contains at most one bomb.

## Visual and sensory constraints
- Keep identifiable mango, strawberry, pineapple, banana and grape emoji. Avoid odd handmade fruit silhouettes.
- Keep a warm cream, coral, ink and yellow palette, with clear fruit contrast.
- The slice trail and short fruit-splitting/juice particles should feel immediate and never obscure bombs.
- Sound should be user-controllable, with accessible focus states and optional device vibration.
- Post-game text should remain minimal. The user rejected the earlier large email-verification form.

## Quality and balance decisions

Test three uncoached rounds per player. Measure first-round survival time, scores, bomb vs miss outcomes, voluntary replay and perceived fairness.

If most players die before meaningful participation, lower opening bomb pressure or adjust early spacing. If almost everyone survives all 45 seconds, increase *late* complexity before altering three-miss rules. If difficulty feels random, fix collision/trajectory fairness before raising bomb frequency.

**Do not change only the browser's physics/wave generation.** The Edge Function recalculates every hit and must remain in agreement with the client. Update both, regression-test valid scores and preserve a rollback point.

## Key acceptance invariants
- One fruit hit can score only once; bombs never score.
- Client and server score arithmetic and positions agree.
- One round cannot be claimed twice.
- Orientation changes preserve the round's reference coordinates.
- Hidden tabs pause the visible game timer without corrupting server verification.
- The same browser retains its official best score and rank after reopening.
- A fabricated straight-line swipe that does not intersect fruit cannot claim a hit.
