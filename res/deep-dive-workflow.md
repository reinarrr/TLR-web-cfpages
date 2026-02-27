# Deep Dive Publishing Workflow
## The Living Room — Step-by-Step

---

## Overview

Each Deep Dive is a hand-crafted HTML file. Claude generates it from your content notes, you drop it in the repo, and Ghost handles the library listing automatically.

**Three moving parts:**
1. The HTML file → lives in the codebase (`res/deep/{year}/`)
2. GitHub push → Cloudflare Pages auto-deploys it
3. Ghost post → registers it in the library (title, thumbnail, excerpt)

---

## What You Need Before Starting

- Study title
- Series label (e.g. *The Acts Journey*)
- Main scripture passage + Bible Gateway URL
- YouTube video ID (the part after `?v=` in the URL)
- Lead quote — the hook sentence that goes on the library card
- Content notes — rough outline, sections, key ideas, scripture, illustrations
- Discussion questions (5–6)
- Closing prayer

Notes can be rough. A sermon outline, bullet points, or a transcript all work.

---

## Step 1 — Send Claude the Content

Give Claude your notes and specify:
- Title
- YouTube ID
- Lead quote / excerpt
- Series label
- Scripture passage

Claude will generate the complete, styled HTML file ready to drop in.

---

## Step 2 — Add the File to the Repo

Save the generated file as:
```
res/deep/{year}/{slug}.html
```

Example:
```
res/deep/2026/net-worth.html
```

The slug should match the post title, lowercase, hyphens only.

---

## Step 3 — Commit and Push

```bash
git add res/deep/2026/your-study.html
git commit -m "Add [Study Title] deep dive"
git push origin ghost-link
```

Cloudflare Pages deploys automatically within ~1 minute.

---

## Step 4 — Create the Ghost Post

Go to `cms.tlrhd.com/ghost` → **New post**

### Post Settings (sidebar ⚙️)

| Field | What to enter |
|---|---|
| **Title** | Study title (e.g. `Net Worth.`) |
| **Excerpt** | The lead quote — this shows on the library card |
| **Tags** | `deep-dive` · `legacy-static` · series tag (e.g. `acts-journey`) |
| **Slug** | Must match the HTML filename exactly (e.g. `net-worth`) |
| **Publish date** | The Sunday the study was taught |

> ⚠️ The slug must match the filename. `net-worth` → `net-worth.html`

### Post Header Code Injection

Sidebar → **Advanced** → **Post header** → paste this, filled in:

```html
<script type="application/json" id="dd-meta">
{
  "seriesLabel": "The Acts Journey",
  "youtubeId": "YOUTUBE_ID_HERE",
  "videoCaption": "Watch the foundation message · Acts 16:16–24",
  "scripture": "Acts 16:16–24",
  "scriptureUrl": "https://www.biblegateway.com/passage/?search=Acts+16%3A16-24&version=NLT"
}
</script>
```

> The body of the Ghost post can be left empty — it's not used for legacy posts.

---

## Step 5 — Publish

Click **Publish** in Ghost. The study appears in the Deep Dives library immediately.

The site routes `/deep-dive.html?slug=net-worth` → `res/deep/2026/net-worth.html` automatically based on the `legacy-static` tag + publish year.

---

## Quick Checklist

- [ ] HTML file named correctly and in `res/deep/{year}/`
- [ ] Pushed to `ghost-link` branch
- [ ] Ghost slug matches filename exactly
- [ ] Tags include `deep-dive` and `legacy-static`
- [ ] Excerpt (lead quote) filled in
- [ ] Publish date set to the correct Sunday
- [ ] dd-meta block in Post header with correct YouTube ID

---

## Folder Structure Reference

```
res/
  deep/
    2026/
      net-worth.html
      open-heart-open-home.html
      the-open-road.html
      redlight-greenlight.html
```

---

*See `ghost-setup-notes.md` for full technical documentation.*
