# Sunday Workflow
## The Living Room — Weekly Publishing Process

Every Sunday has two moments: the service happens, and (usually) a Deep Dive study follows. These are two separate steps in Ghost, intentionally decoupled so the site always stays current even when the study isn't ready.

---

## The Two-Step Process

```
STEP 1 — Sunday (takes ~2 min)
  Create Ghost post: sunday-message tag
  → Replays, home feed, resources banner update immediately

STEP 2 — Study ready (later that week)
  Add deep-dive tag to the same post + drop HTML file in repo
  → Deep Dives library updates
```

---

## Step 1 — After the Service (do the same day)

Go to `cms.tlrhd.com/ghost` → **New post**

### Fill in:

| Field | What to enter |
|---|---|
| **Title** | Sermon title (e.g. `Net Worth.`) |
| **Excerpt** | Lead quote or 1–2 sentence hook |
| **Tags** | `sunday-message` |
| **Slug** | Auto-generated — check it looks clean |
| **Publish date** | Set to today's Sunday date |

### Post Header Code Injection (sidebar → Advanced → Post header):

```html
<script type="application/json" id="dd-meta">
{
  "seriesLabel": "The Acts Journey",
  "youtubeId": "PASTE_YOUTUBE_ID_HERE",
  "videoCaption": "Watch the message · Acts 16:16–24",
  "scripture": "Acts 16:16–24",
  "scriptureUrl": "https://www.biblegateway.com/passage/?search=Acts+16%3A16-24&version=NLT"
}
</script>
```

### Publish

Click **Publish**. Done.

The site now shows this Sunday on:
- Home page YouTube feed (latest 3)
- Replays page (feature card + recent grid)
- Resources page banner (latest message)

> The body of the post can be left completely empty at this stage.

---

## Step 2 — When the Study is Ready

### In Ghost — update the same post:

1. Open the post from Step 1
2. Add tags: `deep-dive` + `legacy-static`
3. Confirm the slug matches the HTML filename (e.g. `net-worth`)
4. Save

### In the repo — add the HTML file:

Send Claude the study content. Claude generates the HTML file. Drop it in:

```
res/deep/{year}/{slug}.html
```

Commit and push:

```bash
git add res/deep/2026/your-study.html
git commit -m "Add [Study Title] deep dive"
git push origin ghost-link
```

Cloudflare Pages deploys within ~1 minute. The study now appears in the Deep Dives library.

---

## Tag Reference

| Tag | When to apply | What it does |
|---|---|---|
| `sunday-message` | Immediately after service | Shows in replays, home feed, resources banner |
| `deep-dive` | When study is ready | Shows in Deep Dives library |
| `legacy-static` | With `deep-dive` (for HTML files) | Routes library link to the HTML file instead of Ghost |

> Every Deep Dive post should have all three tags. A Sunday with no study yet has only `sunday-message`.

---

## If the Video Isn't Uploaded Yet

You can publish the Ghost post without the `youtubeId` — leave it blank or omit it. The post will still appear in feeds with a placeholder thumbnail. When the video goes live on YouTube:

1. Edit the Ghost post
2. Add the `youtubeId` to the dd-meta block in Post Header
3. Save

The site updates automatically. No redeploy needed.

---

## Quick Checklist

### Step 1
- [ ] Ghost post created with `sunday-message` tag
- [ ] Publish date set to the Sunday
- [ ] dd-meta in Post Header with YouTube ID
- [ ] Excerpt (lead quote) filled in
- [ ] Published

### Step 2
- [ ] `deep-dive` and `legacy-static` tags added to Ghost post
- [ ] Slug matches the HTML filename
- [ ] HTML file in `res/deep/{year}/{slug}.html`
- [ ] Committed and pushed to `ghost-link`

---

## Existing Posts — Tag Update Required

The following Ghost posts currently have `deep-dive` + `legacy-static` but are missing `sunday-message`. Add `sunday-message` to each so they appear in the replays/home feed:

- `open-heart-open-home`
- `the-open-road`
- `redlight-greenlight`
- `net-worth` *(once created)*

---

*See `ghost-setup-notes.md` for full technical documentation.*
