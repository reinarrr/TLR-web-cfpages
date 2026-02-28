# Ghost CMS Integration — Technical Notes
## TLR Website · main branch

These notes cover what was built, why decisions were made, and where things live. Written for anyone maintaining or extending this system.

---

## What Was Built

Ghost CMS is the single source of truth for all published content on the TLR site. When a new study is published in Ghost, the Deep Dives library, the home feed, the replays page, and the individual study page all update automatically — no code push required.

**The pipeline:**

```
Ghost CMS (cms.tlrhd.com)
    ↓  [Content API — live]            ↓  [Content API — scheduled]
CF Worker (ghost-proxy)           GitHub Actions (every 2 hrs)
    ↓  [CORS proxy]                    ↓  [writes JSON to repo]
Browser (ghost.js + main.js)      Static JSON fallback files
    ↓                                  ↓  [CF Pages deploys]
Rendered page ←────────────── fallback if Worker/Ghost down
```

---

## Key Files

### Frontend

| File | Purpose |
|---|---|
| `js/ghost.js` | Ghost API integration — fetches posts, maps to card and message formats |
| `js/main.js` | Page logic — all Ghost-first data fetching for every page |
| `index.html` | Home page — loads `ghost.js` + `main.js` |
| `replays.html` | Replays page — loads `ghost.js` + `main.js` |
| `deep-dive.html` | Dynamic template — renders any Ghost post via `?slug=` param |
| `deepdives.html` | Library listing page — year filter buttons |
| `css/style.css` | `.ghost-content` block — styles Ghost-rendered HTML |

### Backend / Infrastructure

| File | Purpose |
|---|---|
| `workers/ghost-proxy.js` | Cloudflare Worker source — NOT auto-deployed, manual push to CF dashboard |
| `scripts/sync-ghost.js` | Node script — fetches Ghost and writes JSON fallback files server-side |
| `.github/workflows/sync-ghost.yml` | GitHub Action — runs sync script every 2 hours + manual trigger |

### Content / Reference

| File | Purpose |
|---|---|
| `res/ghost-snippets.html` | Reusable HTML components for complex Ghost cards (optional, advanced use) |
| `res/ghost-ready/net-worth-ghost.html` | Net Worth study — reference format for Ghost-ready content |
| `res/deep-dive-author-guide.md` | Author guide — step-by-step for content creators |
| `res/sunday-workflow.md` | Weekly publishing process — two-step Sunday → Deep Dive workflow |
| `res/deep/{year}/deepdives.json` | JSON fallback for the Deep Dives library — auto-synced from Ghost every 2 hrs |
| `messages.json` | JSON fallback for replays/home feed — auto-synced from Ghost every 2 hrs |

---

## Ghost CMS

**URL:** `cms.tlrhd.com` (Docker, self-hosted)
**Admin:** `cms.tlrhd.com/ghost`
**Content API key:** `c306251d7f0f57012025d2fdc4` (read-only, safe to expose in JS)

### Ghost API Behaviour Notes

- `codeinjection_head` is returned by default — do NOT add it to a `fields=` param or the API returns 400
- NQL date operators (`>=`, `<`) in filter strings trigger Cloudflare WAF — use client-side year filtering instead
- Feature image upload was disabled in Ghost UI (Docker storage config issue) — bypassed by deriving thumbnail from YouTube ID

---

## Cloudflare Worker (ghost-proxy)

**Why it exists:** Cloudflare Pages (browser) can't call `cms.tlrhd.com` directly because:
1. CORS — Ghost doesn't set `Access-Control-Allow-Origin: *`
2. Bot Fight Mode — Cloudflare blocks browser-originated fetch requests

The Worker runs server-side, proxies the request, adds CORS headers, and uses a shared secret to skip WAF rules.

**Worker URL:** `ghost-proxy.reinar-6fd.workers.dev`
**Deployed:** Manually via Cloudflare Workers dashboard (NOT from Git)
**Source:** `workers/ghost-proxy.js`

**To update the Worker:**
1. Edit `workers/ghost-proxy.js`
2. Log into Cloudflare dashboard → Workers & Pages → ghost-proxy → Edit code
3. Paste updated code → Deploy

---

## Cloudflare WAF (cms.tlrhd.com)

Three custom rules on `cms.tlrhd.com`:

### Rule 1 — Skip (must be FIRST)
```
Expression: http.request.headers["x-proxy-secret"][0] eq "tlr-ghost-2026"
Action: Skip → Custom rules + Super Bot Fight Mode
```
This whitelists Worker requests. **Order matters — must be the first rule evaluated.**

### Rule 2 — Block
```
Expression: (http.host eq "cms.tlrhd.com"
  and not starts_with(http.request.uri.path, "/ghost")
  and not starts_with(http.request.uri.path, "/content")
  and not starts_with(http.request.uri.path, "/p/"))
Action: Block
```
Blocks all public access to the Ghost frontend. The `/p/` exclusion allows Ghost's draft preview URLs (e.g. `cms.tlrhd.com/p/{uuid}/`) to work from the admin — without it, previewing a post returns a block page.

**Shared secret:** `tlr-ghost-2026` (set in worker headers, matched by WAF skip rule)

---

## How Posts Are Fetched

### `fetchGhostDeepDives(year)` — Deep Dives library

```js
const url = `${GHOST_API}/posts/?key=${GHOST_KEY}`
    + `&filter=tag%3Adeep-dive`
    + `&include=tags`
    + `&order=published_at%20desc`
    + `&limit=all`;
```

- Fetches ALL `deep-dive` tagged posts (no server-side year filter — WAF blocks NQL date operators)
- Year filtering is done client-side: `posts.filter(p => new Date(p.published_at).getFullYear() === year)`
- Results are cached browser-side for ~60 seconds (set by Worker's `Cache-Control` header)
- Used by: `deepdives.html` (library), `index.html` (home Deep Dives grid)

### `fetchGhostMessages()` — Replays page, home YouTube feed, resources banner

```js
async function fetchGhostMessages() {
    const url = `${GHOST_API}/posts/?key=${GHOST_KEY}`
        + `&filter=tag%3Asunday-message`
        + `&order=published_at%20desc`
        + `&limit=all`;
    // ... maps to [{ id, title, publishedAt, thumbnail }]
}
```

Fetches posts tagged `sunday-message` — a lightweight tag applied immediately after every service. Decoupled from `deep-dive` so the replays/home feed stays current even when the study isn't ready yet. Posts without a `youtubeId` in dd-meta are skipped silently.

Used by: `replays.html`, `index.html` (YouTube feed), `resources.html` (banner).

**Replaces `messages.json`** — that file previously required a manual code edit every Sunday. Now publishing a Ghost post with `sunday-message` + `youtubeId` in dd-meta is all that's needed. `messages.json` still exists as a silent fallback.

### Ghost-first fallback pattern

`fetchHomeYouTube()` follows Ghost-first:

```js
try {
    const ghostMessages = await fetchGhostMessages();
    if (ghostMessages.length === 0) throw new Error('No Ghost messages');
    messages = ghostMessages.map(...);
} catch (_) {
    // Fallback: YouTube proxy + messages.json
    ...
}
```

### Replays: YouTube-as-base + Ghost-as-override

`fetchReplays()` uses a different pattern — YouTube holds the full historical library, Ghost enriches where a post exists:

```js
const [ytResult, ghostResult] = await Promise.allSettled([
    fetch(PROXY_URL).then(r => r.json()),
    fetchGhostMessages()
]);
// Build Ghost lookup: youtubeId → { title, date }
const ghostMap = {};
if (ghostResult.status === 'fulfilled') {
    ghostResult.value.forEach(m => { ghostMap[m.id] = { title: m.title, date: ... }; });
}
// Merge: YouTube is the list, Ghost enriches where available
const messages = ytResult.value.items.filter(isPastEvent).map(ytVideo => {
    const ghost = ghostMap[videoId];
    return { title: ghost ? ghost.title : ytVideo.snippet.title, ... };
});
```

Ghost failure is non-fatal (`Promise.allSettled`) — the full YouTube archive always shows, Ghost just adds clean titles/dates to recent posts.

---

## Ghost Tag Taxonomy

Every Sunday generates one Ghost post. Tags control where it appears:

| Tag | Applied when | Shows in |
|---|---|---|
| `sunday-message` | Immediately after service | Replays, home feed, resources banner |
| `deep-dive` | When study is ready | Deep Dives library |
| `legacy-static` | With `deep-dive`, for HTML files | Routes library link to `/res/deep/{year}/{slug}.html` |

A post starts with only `sunday-message`. Tags are added as content becomes ready. A fully published study has all three.

> **Action required:** Existing posts (`open-heart-open-home`, `the-open-road`, `redlight-greenlight`) need `sunday-message` added in Ghost so they appear in replays/home feed.

---

## Post Routing: Legacy vs. Native

Posts can be one of two types:

### Legacy-static posts
Posts tagged `legacy-static` — route to pre-existing HTML files generated by Claude.

URL is derived automatically from `published_at` year + slug:
```
/res/deep/{year}/{slug}.html
```
Example: `net-worth` published in 2026 → `/res/deep/2026/net-worth.html`

**Legacy posts in Ghost (as of Feb 2026):**
- `open-heart-open-home` → `/res/deep/2026/open-heart-open-home.html`
- `the-open-road` → `/res/deep/2026/the-open-road.html`
- `redlight-greenlight` → `/res/deep/2026/redlight-greenlight.html`

### Native Ghost posts
Posts tagged `deep-dive` without `legacy-static` — render through `deep-dive.html?slug={slug}`, fetching the Ghost post body and rendering it with `.ghost-content` CSS applied.

---

## dd-meta Pattern

Each Ghost post stores metadata in `codeinjection_head` as a JSON blob:

```html
<script type="application/json" id="dd-meta">
{
  "seriesLabel": "The Acts Journey",
  "youtubeId": "YOUTUBE_VIDEO_ID",
  "videoCaption": "Watch the foundation message · Acts 16:16–24",
  "scripture": "Acts 16:16–24",
  "scriptureUrl": "https://www.biblegateway.com/..."
}
</script>
```

This drives the top of every Deep Dive page:
- Series label
- YouTube embed (with thumbnail fallback on library cards)
- Scripture reference + link

`ghost.js` calls `parseDdMeta(post.codeinjection_head)` to extract these values.

---

## YouTube Thumbnail Fallback

When a Ghost post has no `feature_image`, the library card uses the YouTube thumbnail:

```js
const ytFallback = meta.youtubeId
    ? `https://img.youtube.com/vi/${meta.youtubeId}/maxresdefault.jpg`
    : '';
return {
    image: post.feature_image || ytFallback,
    ...
};
```

Setting the `youtubeId` in dd-meta is sufficient — no separate image upload needed.

## Dynamic YouTube Embed in Legacy HTML Files

Legacy static HTML files (e.g. `net-worth.html`) pull the YouTube ID from Ghost at runtime rather than hardcoding it. This means the HTML can be generated and committed before the video is uploaded — just add the `youtubeId` to the Ghost post's dd-meta when the video is ready.

**How it works:**

```html
<section id="yt-section" style="display:none">
    <iframe id="yt-iframe" src=""></iframe>
    <p id="yt-caption"></p>
</section>

<script>
(async function () {
    const slug = location.pathname.split('/').pop().replace('.html', '');
    const res = await fetch(`${PROXY}/ghost/api/content/posts/slug/${slug}/?key=${KEY}`);
    const meta = parseDdMeta(data.posts[0].codeinjection_head);
    if (meta.youtubeId) {
        document.getElementById('yt-iframe').src = `https://www.youtube.com/embed/${meta.youtubeId}`;
        document.getElementById('yt-section').style.display = '';
    }
})();
</script>
```

- The section is hidden by default
- Script reads its own slug from the URL path, fetches that Ghost post, injects the YouTube ID
- If Ghost is unavailable, the section stays hidden — the rest of the page loads normally
- Copy this pattern into every new legacy HTML file generated

---

## Local JSON Fallback

If the Ghost API or Worker fails, `main.js` falls back to static JSON files baked into the repo:

```js
try {
    posts = await fetchGhostDeepDives(year);
} catch (e) {
    const res = await fetch(`/res/deep/${year}/deepdives.json`);
    posts = await res.json();
}
```

**These files are now auto-synced — do not edit them manually.**

The GitHub Actions workflow (`sync-ghost.yml`) fetches Ghost every 2 hours and commits updated JSON directly to `main`. CF Pages then redeploys with fresh data baked in.

**Full resilience chain:**
```
Normal:           Browser → Worker → Ghost         (live, always fresh)
Worker down:      Browser → static JSON            (≤ 2 hrs stale max)
Ghost down:       Browser → Worker fails → JSON    (≤ 2 hrs stale max)
Everything down:  CF Pages serves static HTML+JSON (always works)
```

**To trigger an immediate sync** (e.g. after publishing a new post):
GitHub → Actions tab → "Sync Ghost CMS" → Run workflow

---

## Deployment

**Cloudflare Pages** auto-deploys the `main` branch on every push to GitHub.
**Cloudflare Worker** (`ghost-proxy`) is deployed manually — it is NOT connected to Git.
**GitHub Actions** (`sync-ghost.yml`) runs every 2 hours on a schedule and commits updated JSON to `main`, which triggers a CF Pages redeploy.

---

## Gotchas and Lessons Learned

1. **WAF skip rule order is critical.** The skip rule must be evaluated BEFORE the block rule. In CF dashboard, move it to position 1.

2. **Don't use `fields=` in Ghost API calls.** `codeinjection_head` cannot be explicitly requested in `fields`; it returns 400. Remove `fields=` entirely — Ghost returns all fields by default.

3. **NQL date operators break the WAF.** Even with the skip rule in place, `>=` and `<` in query strings trigger WAF on outbound Worker requests to Ghost. Filter by year client-side.

4. **Browser cache.** If content looks stale, hard-refresh (Cmd+Shift+R). Worker sets 60-second cache.

5. **Feature image upload is broken in Ghost Docker instance.** Not fixed — bypassed via YouTube thumbnail fallback. The Docker `volumes:` config likely has a storage path issue; left as-is since the workaround is clean.

6. **Ghost post preview blocked by WAF.** The Ghost editor's preview opens at `/p/{uuid}/` — this path wasn't whitelisted in the block rule, so previewing a draft returned a Cloudflare block page. Fixed by adding `and not starts_with(http.request.uri.path, "/p/")` to the block rule expression.

7. **`messages.json` and `deepdives.json` are auto-synced — don't edit them manually.** The GitHub Actions sync script overwrites them every 2 hours from Ghost. Any manual edits will be overwritten on the next sync run.

8. **GitHub Actions needs write permissions to push JSON updates.** Repo → Settings → Actions → General → Workflow permissions → "Read and write permissions". Without this the sync job fails at the push step with exit code 128.

9. **`ghost.js` must be loaded before `main.js`.** Any page that calls Ghost functions needs both scripts, in order. `index.html` and `replays.html` both load `ghost.js` then `main.js`. Forgetting `ghost.js` causes silent failures — the Ghost-first path errors and falls through to the fallback.

---

*Last updated: February 2026*
