# MoEasy Codex to Claude Handoff

Updated: 2026-10-07 (Asia/Seoul)

This file transfers the useful project context from the long-running Codex conversation. It is a curated handoff, not a verbatim transcript. Verify drift-prone facts such as remote state, deployed behavior, backend responses, and Notion contents before relying on them.

## Current repository state at handoff

- Working directory: `/Users/simminsik/Desktop/MoEasy`
- Branch: `main`
- Handoff commit: `94f4f52` (`fix: 영수증 OCR 합계 및 사용처 인식 안정화 (#38)`)
- At the time of handoff, `main`, `origin/main`, and `personal/main` pointed to the same commit and the worktree was clean before these documentation files were created.
- Organization repository and personal mirror are listed in `@docs/PROJECT_LINKS.md`.

Before every new task, run:

```bash
git status --short --branch
git log -8 --oneline --decorate
git remote -v
```

## Product summary

MoEasy is a responsive meeting-management frontend covering meeting discovery, joined meetings, schedules, maps, community, chat workflows, dues/settlements, profiles, social authentication, onboarding, receipt OCR, and PWA installation.

The UI supports mobile, tablet, and desktop layouts. The current visual direction uses a dark navy foundation, blue brand accents, restrained cards, and responsive navigation rather than prototype-style oversized gradients or AI-like decorative elements.

## Important product decisions

1. Backend source code must never be modified from this project.
2. Login/signup is social-only through Kakao and Google. There is no local email/password signup.
3. A new social-login member proceeds to onboarding when the backend login result has `onboardingCompleted: false`.
4. Onboarding profile data is currently persisted locally per backend member ID. No frontend call that updates onboarding on the backend is wired at this handoff.
5. Google Maps renders the map and custom markers. Kakao Places supplements place search. Kakao Login and Kakao Maps use separate frontend environment variables.
6. OCR runs in the browser with Tesseract.js; receipt images are not intentionally uploaded by the OCR flow.
7. Desktop should not show the PWA install prompt. PWA install behavior is primarily for compatible mobile/tablet environments.
8. User-facing data that is still mocked or locally persisted must not be presented as confirmed backend persistence.

## Main application routes

- `/` - home
- `/explore` - meeting discovery
- `/map` - map and place/meeting markers
- `/schedule` - schedule
- `/profile` - profile
- `/meetups/:id` - meeting detail
- `/oauth/kakao/callback` - Kakao OAuth callback
- `/oauth/google/callback` - Google OAuth callback

Route coordination and much of the current demo state live in `src/app/App.tsx`. It is a large file, so inspect the relevant state and rendering branch before modifying a feature.

## Runtime and API behavior

Configuration is defined in `src/app/config/runtime.ts`.

- `VITE_DATA_SOURCE=api` enables API mode; other values select local mode.
- Development API fallback: `https://jeonggyul.duckdns.org/api/v1`
- Production API fallback: same-origin `/api/v1`
- `vercel.json` proxies production `/api/v1/*` requests to the Spring server and rewrites other paths to the SPA entry point.

`src/app/lib/apiClient.ts` provides:

- `credentials: include` for cookie-based authentication
- CSRF retrieval from `/auth/csrf`
- automatic CSRF header attachment for state-changing requests
- one CSRF refresh/retry for the documented 403 code
- one `/auth/reissue` attempt for the documented expired-auth 401 code
- support for both `result` and `data` API envelopes

Frontend API bindings in `src/app/services/p0Api.ts` currently cover:

- OAuth state, social login, token reissue, and logout
- current user and current user's meetings
- meeting search/detail/create
- schedule list/create/update/delete and RSVP
- community post creation

Treat the bindings as frontend expectations, not proof that every backend endpoint currently works. Check the live response before diagnosing ownership.

## Social authentication

Implementation files:

- `src/app/services/oauth.ts`
- `src/app/services/authSession.ts`
- `src/app/lib/kakaoAuth.ts`
- `src/app/services/p0Api.ts`

OAuth redirect URIs are constructed from the active origin:

```text
<origin>/oauth/kakao/callback
<origin>/oauth/google/callback
```

Therefore, both the localhost origin and deployed origin must be registered with each provider as appropriate. Repeatedly creating a new member for the same social account is not safely solvable by frontend-only identity matching; diagnose the backend provider identity mapping and login response before applying a workaround.

The navbar/profile name prefers `/users/me`'s nickname, then the locally persisted onboarding nickname, then the member ID fallback. Logout calls the backend endpoint and always clears the local auth session afterward.

## Maps

Implementation files:

- `src/app/components/MapPage.tsx`
- `src/app/lib/mapServices.ts`

Intended split:

- Google Maps JavaScript API: primary map rendering and customized markers
- Kakao Places SDK: Korean place-search supplementation

If maps or search fail, check all of the following before changing code:

- required frontend variable exists in the active environment
- the correct Kakao key is used for Maps rather than Login
- JavaScript/domain restrictions include the current localhost or deployed origin
- Google Maps JavaScript API and required libraries are enabled
- the key is present in Vercel for the correct environment and a new deployment was created

## Receipt OCR

Implementation files:

- `src/app/services/receiptOcr.ts`
- `src/app/components/ReceiptOcrExperience.tsx`

Pipeline:

1. Load Tesseract.js with Korean and English trained data.
2. Resize the longest image side toward 1800 px, capped at 2800 px.
3. Convert RGB to luminance using `Y = R*0.299 + G*0.587 + B*0.114`.
4. Normalize luminance between the image's 2nd and 98th percentile with a minimum range of 40.
5. For normalized values below 150, multiply by 0.82. For values at or above 150, use `150 + (value - 150) * 1.18`. Clamp to 0-255 and write the value back to all RGB channels.
6. OCR the enhanced full image in sparse-text mode, the original full image in automatic mode, and the enhanced image cropped from 42% height downward.
7. Merge unique recognized lines and rank repeated candidates.

Amount extraction:

- prioritize final-total, payment, approval, billing, and `TOTAL` aliases
- reward currency markers, grouped digits, lower-page position, and repeated appearances
- penalize business/card/approval/order numbers, dates/times, tax, subtotal, discount, quantity, and unit price
- normalize common OCR mistakes `O/Q/D -> 0` and `I/l/| -> 1`
- inspect up to the next three lines when a total keyword and amount are split
- expose the top candidates and allow manual correction and raw-text reanalysis

Store extraction prioritizes explicit merchant labels and plausible header lines, rejects receipt metadata/address/phone/amount lines, merges split header tokens such as `THE` + `HYUNDAI`, and exposes multiple selectable candidates.

Do not describe this as a custom-trained OCR model. It is pretrained Tesseract plus frontend preprocessing, heuristics, candidate scoring, and manual correction.

## Local persistence and linked workflows

Important local keys include:

- `moeasy:authSession`
- `moeasy:userProfile`
- `moeasy:userProfilesByMember`
- `moeasy:myMeetups`
- `moeasy:exploreMeetups`
- `moeasy:scheduleEvents`
- per-meeting schedule, finance, and group-chat keys from `src/app/services/meetupOperations.ts`

Chat workflows are designed to link messages to meeting schedules, settlements, transfers, and finance completion state. Existing slash-command work includes operations such as sending money and settlement; do not implement those as isolated duplicates. Inspect `meetupOperations.ts`, `GroupChatExperience.tsx`, and the target schedule/finance UI together.

## PWA and branding

- PWA configuration is in `vite.config.ts` using `vite-plugin-pwa`.
- The service worker caches application assets, Tesseract runtime data, and same-origin images.
- Brand/PWA assets are under `public/brand`, `public/favicon*`, `public/pwa-*`, and `src/assets/brand`.
- The wordmark and favicon were derived from the user's supplied logo. Avoid recreating them from a different vector approximation without comparing against the accepted assets.

## Environment variables

Use `.env.example` as the canonical list. At handoff it contains:

```text
VITE_GOOGLE_MAPS_API_KEY
VITE_KAKAO_LOGIN_JAVASCRIPT_KEY
VITE_KAKAO_MAP_JAVASCRIPT_KEY
VITE_API_BASE_URL
VITE_DATA_SOURCE
VITE_GOOGLE_WEB_CLIENT_ID
```

`.env.local` is ignored through the `*.local` rule. Never print its values in chat, copy them into handoff documents, or commit them. Provider secrets belong on the backend; only browser-appropriate public keys/client IDs belong in `VITE_*` variables.

## Commands and verification

```bash
npm install
npm run dev
npm run build
```

There is no dedicated `lint` or `test` script at this handoff. For a frontend change:

1. inspect `git diff --check`
2. run `npm run build`
3. test the affected viewport and route when practical
4. verify `git status --short`
5. clearly distinguish local completion, pushed branch, open PR, merged PR, and deployed production

## Known boundaries and follow-up checks

- Live backend availability and endpoint behavior can change independently of this repository.
- OAuth provider consoles, Vercel variables, Notion permissions, and deployed domain allowlists are external state and must be checked live.
- Some major screens still use mock/local data even though an API service layer exists.
- Do not claim backend onboarding persistence until a backend endpoint is documented and wired.
- Do not claim OCR accuracy percentages without a labeled receipt test set and measured results.
- Do not assume a merged PR means Vercel production is updated; verify the deployment URL and commit.

