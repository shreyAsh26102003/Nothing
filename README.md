# Nothing.

A small browser fruit-slicing game by After All.

## Status
- 45-second rounds, progressively harder waves, 3 misses, bombs, browser-generated sound and shareable scores.
- Leaderboard UI and read-only API scaffold included; no official score submissions, verified identities, persistent rankings, or reward eligibility yet.
- Server-side credentials must be configured before the leaderboard can read a database.

## Run
Open index.html locally to try gameplay. Run `npm test` to test difficulty and sharing logic.

## Deployment
Static frontend plus Vercel serverless API. Connect this repository to a Vercel project. No custom domain is configured by this commit.
