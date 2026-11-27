# Release checklist — Nothing.
Scope: preview now, campaign later. Check off only with evidence (screenshot, URL, test run or named reviewer).

## Preview release
- [x] Original fruit emoji restored and 3-miss rule implemented.
- [x] Server-generated waves and rising bomb risk implemented.
- [x] Score submission endpoint and global leaderboard implemented.
- [x] Private Supabase tables and security policy configuration exist.
- [x] Guest-local browser identity; no email gate.
- [x] Player score review, admin reporting and top-100 visibility hold available.
- [x] Anonymous event tracking and internal Supabase analytics notebook created.
- [x] Automated source and simulated browser tests available.
- [x] Daily/on-push HTTP health workflow installed and observed passing.
- [x] Preview deployed at nothing-after-all.vercel.app.
- [ ] **Confirm current GitHub Actions suite is green after latest source and test commits.**
- [ ] **Test full round, score claim, leaderboard and persistence on a real iPhone.**
- [ ] **Test Android Chrome, desktop Safari/Chrome and in-app browsers.**
- [ ] **Verify screen resizing, interrupted calls, backgrounding, slow networks and offline fallback on actual devices.**
- [ ] **Review app on 280px, 375px, 430px and desktop viewports with human eyes.**
- [ ] **Resolve Vercel Git integration and automate deploy-on-push to existing project.**

## Public campaign with rewards
- [ ] Written reward offer, dates, maximum entries, participant age and region confirmed.
- [ ] Identity verification protocol and prize claim form approved.
- [ ] Winner eligibility, ties, anti-cheat, appeals and disqualification language approved by counsel.
- [ ] Duplicate player abuse review; privacy review of any necessary contact collection.
- [ ] Fulfilment process and costs agreed (products, cold chain if applicable, shipping, taxes).
- [ ] Test 20–30 people with replay/score feedback; freeze tuned difficulty.
- [ ] Configure production communications provider and unsubscribe/suppression process.
- [ ] Legal approval of privacy notice and cookie/data-retention policy.
- [ ] Final launch communications and WhatsApp/Instagram sharing tested end to end.
- [ ] Named incident and prize-review owners.
- [ ] Explicit approval to connect the custom domain.

## Go/no-go rules
No public reward announcement until no critical severity bugs remain; real-user submission success and recovery are verified; privacy and game rules are approved; and at least two authorized operators can review/remove a suspicious score. No amount of automated testing substitutes for real-device and human beta checks.
