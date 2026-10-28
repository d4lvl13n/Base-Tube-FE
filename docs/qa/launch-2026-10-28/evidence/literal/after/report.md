# Literal-English persona rerun — 28 October 2026

Real isolated Chromium session `after-literal`; live frontend asset `main.f21a18c7.js`. The anonymous journey stops before account creation; authenticated continuation uses the user's explicitly authorized existing account via browser state-load, without opening or printing the state file. No signup, payment, settings change, YouTube connection or personal upload.

## Anonymous path

Marketing landing → Start 7-day free trial → signup. All three baseline findings pass now. Signup states: “Next: secure checkout for your 7-day free trial of Creator. Thumbnails for 2 videos included (3 thumbnail options per video). A card is required. Then US$24/month, starting on day 8, unless you cancel.” Pricing, Terms of Service, Privacy Policy and Refund Policy links are visible. Evidence: 01-landing.png and 02-signup.png.

## Thumbnail generation: PASS

Opened Studio, kept Start fresh, entered “QA launch: Can You Beat Minecraft With Only Wooden Tools?”, selected 1 concept. The button explicitly said “Generate 1 concept · 15 credits”. One click created project `ed572485-9fda-4e32-b96b-e048aa7ab0d6`. Credits 866 → 851: exactly 15. The image became visibly ready approximately 39 seconds after submission, with a Minecraft scene and “WOODEN TOOLS ONLY?”; version cd4d7862. Download, Refine and Keep are visible. No retry. Evidence: 03-studio-before-generate.png, 04-generation-waiting.png, 05-thumbnail-ready.png.

## Garter channel audit: PASS; navigation recovery defect reproduced

Entered public URL https://www.youtube.com/channel/UCYPAfSAa68ZQWmJOufBkotQ and clicked Audit channel exactly once at approximately 06:40 UTC. Auditing... and Preparing your channel audit… appeared. No YouTube connection. Left via Projects while preparing, then returned to Channel Audit by full navigation approximately 25 seconds later. The screen returned to a blank form, with no prior URL, progress or saved job. History listed only Garter dated 27 Oct 2026, not this run. No resubmission. Evidence 06-channel-before-audit.png, 07-audit-progress.png, 08-audit-return-blank.png, 09-history-no-new-audit.png. Root notified immediately for backend recovery. Root confirmed the synchronous server request continues after navigation, while the frontend loses its local progress state. At 06:46:33 UTC a manual History reload showed a new Garter report dated28Oct. Opened actual report20 at https://beta.base.tube/ai-thumbnails/channel-audit?audit=20. One submission only; no retry. Audit debit0; final shared balance836 comprises my15-credit generation and breaker’s separate15-credit generation. Background completion succeeded; frontend resume needs its targeted fix.

## Remaining observations

- P1: Background audit is not recoverable from the Channel Audit screen after leaving and returning; no in-progress History item is visible. A literal reader is encouraged to start again, risking duplicate work.
- P2: Audit channel button has no price next to it; the sidebar only says “Audit 2 credits”, which does not distinguish thumbnail review from channel audit. Actual channel audit charge is not yet attributable; another authorized persona used the same account concurrently for generation.
- P3: “Channel Packaging Audit”, “falsifiable” and “Swipe file” are specialized language. The surrounding paragraphs explain the general benefit, so this did not prevent entry, but simpler labels would suit a literal non-native reader.

No false assertion of successful signup or completed audit.


## Completed audit20 UI validation

- Report opens and visibly renders diagnosis, usual/outlier comparison, three ideas, experiment, three families with two image examples each, external references and expanded full audit/evidence board. No blank result or broken image in these sections.
- Diagnosis connects the770K walking video with the330K “Which3D Zelda Game Actually Takes the Longest to Beat?” video; both are collection-wide time questions. The median is24K, so the displayed multiple is32×.
- Families are concrete: “Three tall panels with SHORT–???–LONG wording”, “Two locations divided by a large Link face”, and “Three tall ranking panels with WORST–MID–BEST wording”. Each has2actual images and visible text matching its broad layout.
- Ideas: “How Long Does It Take to Reach Every Dungeon Across the Zelda Series?”, “How Long Does It Take to Beat Every3D Zelda Game Back-to-Back?”, and “How Long Does It Take to Travel Between Wind Waker’s Farthest-Apart Dungeons?”. Two out of three span the series. Thumbnail instructions use a map/dashedroute/brief wording, making the connection visible.
- P2content inconsistency: Experiment A shows vJCQ8ZwfXJ8, the Wind Waker SHORT/???/LONG three-panel image, but says: “Use the familiar two-scene dungeon-reach layout: two contrasting dungeon scenes with a large illustrated Link face overlapping them. Text: ‘REACH EVERY DUNGEON?’” The prose and shown reference disagree. B uses FI3KkTgdXec and matches the brown-map/dashed-route image. Screenshot14captures this exactly.
- Important screenshots:10-history-new-audit.png,11-audit20-plan-full.png,12-audit20-three-ideas.png,13-audit20-three-families.png,14-audit20-test.png,15-audit20-full-evidence.png. Literal visible UI text: audit20-plan-ui.txt and audit20-full-ui.txt. Full evidence is expanded in the latter; optional nested disclosures remain at their normal default state.

The old progress-loss issue is documented as reproduced on main.f21a18c7.js, not as a failure of background computation. A different persona will test a new audit after the recovery fix is deployed; no duplicate audit was submitted in this session.
