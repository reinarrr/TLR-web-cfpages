# Deep Dive Author Guide
## The Living Room — How to Publish a New Deep Dive

This guide is for anyone creating a new Deep Dive study on the TLR site. You don't need to touch any code. You just need access to Ghost CMS.

---

## Before You Start

You'll need:
- Login to **Ghost CMS** at `cms.tlrhd.com/ghost`
- The study content (outline, scripture, discussion questions, closing prayer)
- The **YouTube video ID** — this is the last part of the video URL
  e.g. `youtube.com/watch?v=dQw4w9WgXcQ` → the ID is `dQw4w9WgXcQ`

---

## Step 1 — Create a New Post

1. In Ghost, click **New post** (top right)
2. Type the **post title** — keep it short, punchy
   Example: `Net Worth.` or `The Open Road`

---

## Step 2 — Set the Post Metadata (Sidebar)

Click the **Settings icon** (gear ⚙️) in the top-right of the editor to open the post sidebar.

Fill in these fields:

| Field | What to put |
|---|---|
| **Excerpt** | The lead quote or 1–2 sentence hook readers see on the library page |
| **Tags** | Always add `deep-dive`. Add a series tag like `acts-journey` if applicable. |
| **URL (Slug)** | Ghost auto-generates from the title. Check it looks clean. e.g. `net-worth` |
| **Publish date** | Set this to the actual Sunday the study was taught |

> **Tags are how the site finds the post.** Every Deep Dive MUST have the `deep-dive` tag or it won't appear on the site.

---

## Step 3 — Add the dd-meta Block (Post Header)

This is the **one technical step**. It tells the site what YouTube video to show, what scripture to link, and what series label to display at the top.

**How to get there:**
Post sidebar → scroll down → **Advanced** → **Post header**

Paste this block into the Post header field, and fill in the values for your study:

```html
<script type="application/json" id="dd-meta">
{
  "seriesLabel": "The Acts Journey",
  "youtubeId": "PASTE_YOUTUBE_ID_HERE",
  "videoCaption": "Watch the foundation message · Acts 16:16–24",
  "scripture": "Acts 16:16–24",
  "scriptureUrl": "https://www.biblegateway.com/passage/?search=Acts+16%3A16-24&version=NLT"
}
</script>
```

**Replace these values:**

| Value | What to change |
|---|---|
| `seriesLabel` | Name of the sermon series (e.g. `"The Acts Journey"`) |
| `youtubeId` | The YouTube video ID for this study |
| `videoCaption` | Short caption below the video (e.g. `"Watch the message · Acts 16:16–24"`) |
| `scripture` | Main passage reference (e.g. `"Acts 16:16–24"`) |
| `scriptureUrl` | Bible Gateway link to the passage |

> **Why is this important?** This block drives the top of every Deep Dive page automatically — the title, lead quote, series label, YouTube embed, and scripture link all come from the post itself. You don't add any of that in the body.

**Getting a Bible Gateway URL:**
Go to biblegateway.com, search for your passage, select NLT, then copy the URL from your browser. Paste the full URL into `scriptureUrl`.

---

## Step 4 — Write the Body Content

Everything below the dd-meta block is written directly in Ghost's editor — no HTML required.

**What the dd-meta already handles (don't add these again):**
- The series label header
- The page title
- The lead quote
- The scripture reference + link
- The YouTube embed

**Start your body with the first section heading.** Here's what each week's body typically includes:

---

### Content Structure (use this as a template)

#### The Setup *(optional — sets the scene, connects to last week)*

```
## [Setup Heading]

[1–2 paragraphs establishing context]

> [Key quote or framing statement]
```

---

#### Main Sections *(usually 3–5)*

```
## I. [Section Title]

[Paragraphs of content]

### [Sub-heading if needed]

[More content]

> [Scripture or key quote — use blockquote]
```

For the **big idea of each section**, use Ghost's built-in Callout:
Type `/callout` in the editor → a shaded box appears → type your key quote or idea inside it.

---

#### Discussion & Reflection

```
## Discussion & Reflection

1. [Question one]

2. [Question two]

3. [Question three]

(etc.)
```

---

#### Closing

```
[1–2 closing paragraphs — the "A Thought" moment]

> [Closing prayer — use blockquote]

*[Final send-off line — italic]*
```

---

### Ghost Editor Quick Reference

| What you want | How to do it |
|---|---|
| Section heading | Type `##` then space, or use toolbar |
| Sub-heading | Type `###` then space |
| Key quote / scripture | Type `>` then space (blockquote) |
| Highlighted callout box | Type `/callout` |
| Bold | Select text → Cmd+B or `**text**` |
| Italic | Select text → Cmd+I or `*text*` |
| Numbered list | Type `1.` then space |
| Bullet list | Type `-` then space |
| Divider line | Type `/divider` |
| Section break between topics | Use `/divider` |

---

## Step 5 — Publish

1. Review the post — click **Preview** to see it in Ghost
2. When ready, click **Publish** in the top right
3. Set the publish date to match the Sunday of the study
4. Click **Publish** to confirm

**The site updates automatically.** No code push, no deploy — the study appears on the Deep Dives library within a minute of publishing.

---

## What the Site Does Automatically

Once published, the site:
- Shows the post in the Deep Dives library (deepdives.html), sorted by date
- Displays the YouTube thumbnail as the card image
- Routes the URL to `/deep-dive.html?slug=your-slug`
- Renders all your Ghost content with the site's typography and styling

---

## Example Reference

The `res/ghost-ready/` folder contains reference files for past studies showing exactly what to write and in what order. Use them as templates — they're written as "type this in Ghost" scripts, top to bottom.

---

## Troubleshooting

**Post not appearing on site:**
Check that `deep-dive` is listed in the post's Tags. This is the most common issue.

**YouTube not showing:**
Check the `youtubeId` in the dd-meta block. Make sure it's just the ID (e.g. `dQw4w9WgXcQ`), not the full URL.

**Styling looks off:**
The site's CSS handles all styling. Just use standard Ghost headings and blockquotes — don't try to paste custom HTML for styling.

**Site showing old content:**
Hard-refresh the browser (Cmd+Shift+R on Mac). The site caches for ~60 seconds.

---

*Last updated: February 2026*
