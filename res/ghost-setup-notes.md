# Ghost CMS Integration — Technical Notes
## TLR Website · ghost-link branch

These notes cover what was built, why decisions were made, and where things live. Written for anyone maintaining or extending this system.

---

## What Was Built

The TLR site (hosted on Cloudflare Pages, `ghost-link` branch) now loads Deep Dive content directly from Ghost CMS. When a new study is published in Ghost, it appears on the site automatically — no code push required.

**The pipeline:**

```
Ghost CMS (cms.tlrhd.com)
    ↓  [Content API]
Cloudflare Worker (ghost-proxy.reinar-6fd.workers.dev)
    ↓  [CORS proxy + secret header]
Browser (deepdives.html / deep-dive.html)
    ↓  [ghost.js + main.js]
Rendered page
```

---

## Key Files

### Frontend

| File | Purpose |
|---|---|
| `js/ghost.js` | Ghost API integration — fetches posts, maps to card format |
| `js/main.js` | Page logic — calls `fetchGhostDeepDives()`, renders cards |
| `deep-dive.html` | Dynamic template — renders any Ghost post via `?slug=` param |
| `deepdives.html` | Library listing page — year filter buttons |
| `css/style.css` | `.ghost-content` block — styles Ghost-rendered HTML |

### Backend / Infrastructure

| File | Purpose |
|---|---|
| `workers/ghost-proxy.js` | Cloudflare Worker source — NOT auto-deployed, manual push to CF dashboard |

### Content / Reference

| File | Purpose |
|---|---|
| `res/ghost-snippets.html` | Reusable HTML components for complex Ghost cards (optional, advanced use) |
| `res/ghost-ready/net-worth-ghost.html` | Net Worth study — reference for how to write a Ghost post |
| `res/deep-dive-author-guide.md` | Author guide — step-by-step for content creators |
| `res/deep/2026/deepdives.json` | Local JSON fallback for the library listing |

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

Two custom rules on `cms.tlrhd.com`:

### Rule 1 — Skip (must be FIRST)
```
Expression: http.request.headers["x-proxy-secret"][0] eq "tlr-ghost-2026"
Action: Skip → Custom rules + Super Bot Fight Mode
```
This whitelists Worker requests. **Order matters — must be the first rule evaluated.**

### Rule 2 — Block
```
Expression: [blocks all direct browser access to cms frontend]
Action: Block
```
This prevents public access to the Ghost CMS admin/frontend.

**Shared secret:** `tlr-ghost-2026` (set in worker headers, matched by WAF skip rule)

---

## How Posts Are Fetched

**ghost.js `fetchGhostDeepDives(year)`:**
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

---

## Post Routing: Legacy vs. Native

Posts can be one of two types:

### Legacy-static posts
Posts tagged `legacy-static` — these exist in Ghost for library listing purposes but route to pre-existing HTML files.

URL is derived automatically from `published_at` year + slug:
```
/res/deep/{year}/{slug}.html
```
Example: `net-worth` published in 2026 → `/res/deep/2026/net-worth.html`

**Three legacy posts in Ghost (as of Feb 2026):**
- `open-heart-open-home` → `/res/deep/2026/open-heart-open-home.html`
- `the-open-road` → `/res/deep/2026/the-open-road.html`
- `redlight-greenlight` → `/res/deep/2026/redlight-greenlight.html`

### Native Ghost posts
Everything else — post renders through `deep-dive.html?slug={slug}`, which fetches the Ghost post body and renders it with `.ghost-content` CSS applied.

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

This means setting the `youtubeId` in dd-meta is sufficient — no separate image upload needed.

---

## Local JSON Fallback

If the Ghost API fails entirely, `main.js` falls back to `res/deep/2026/deepdives.json`:

```js
try {
    posts = await fetchGhostDeepDives(year);
} catch (e) {
    // fall back to local JSON
    const res = await fetch(`/res/deep/${year}/deepdives.json`);
    posts = await res.json();
}
```

Keep `deepdives.json` updated as a backup — it contains title, url, image, excerpt for each study.

---

## Deployment

**Cloudflare Pages** auto-deploys the `ghost-link` branch on every push to GitHub.
**Cloudflare Worker** (`ghost-proxy`) is deployed manually — it is NOT connected to Git.

The `ghost-link` branch will eventually be merged to `main` when Ghost integration is confirmed stable.

---

## Gotchas and Lessons Learned

1. **WAF skip rule order is critical.** The skip rule must be evaluated BEFORE the block rule. In CF dashboard, move it to position 1.

2. **Don't use `fields=` in Ghost API calls.** `codeinjection_head` cannot be explicitly requested in `fields`; it returns 400. Remove `fields=` entirely — Ghost returns all fields by default.

3. **NQL date operators break the WAF.** Even with the skip rule in place, `>=` and `<` in query strings trigger WAF on outbound Worker requests to Ghost. Filter by year client-side.

4. **Browser cache.** If content looks stale, hard-refresh (Cmd+Shift+R). Worker sets 60-second cache.

5. **Feature image upload is broken in Ghost Docker instance.** Not fixed — bypassed via YouTube thumbnail fallback. The Docker `volumes:` config likely has a storage path issue; left as-is since the workaround is clean.

---

*Last updated: February 2026*
