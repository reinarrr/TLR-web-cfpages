#!/usr/bin/env node
/**
 * sync-ghost.js
 *
 * Fetches published posts from Ghost CMS and writes static JSON fallback files.
 * Runs server-side (Node.js 18+) so CORS is not an issue — calls Ghost directly.
 *
 * Outputs:
 *   res/deep/{year}/deepdives.json  — one file per year, from deep-dive tagged posts
 *   messages.json                   — from sunday-message tagged posts
 */

const fs   = require('fs');
const path = require('path');

const GHOST_ORIGIN = process.env.GHOST_ORIGIN || 'https://cms.tlrhd.com';
const GHOST_KEY    = process.env.GHOST_KEY    || 'c306251d7f0f57012025d2fdc4';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDdMeta(codeinjectionHead) {
    if (!codeinjectionHead) return {};
    const match = codeinjectionHead.match(/<script[^>]*id="dd-meta"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return {};
    try { return JSON.parse(match[1].trim()); } catch { return {}; }
}

function formatDate(iso) {
    const d   = new Date(iso);
    const day = d.getUTCDate();
    const mon = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
    const yr  = d.getUTCFullYear();
    return `${day} ${mon} ${yr}`;
}

async function fetchPosts(tag) {
    const url =
        `${GHOST_ORIGIN}/ghost/api/content/posts/` +
        `?key=${GHOST_KEY}` +
        `&filter=tag%3A${tag}` +
        `&include=tags` +
        `&order=published_at%20desc` +
        `&limit=all`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ghost API ${res.status} for tag:${tag}`);
    const data = await res.json();
    return data.posts || [];
}

// ─── Deep Dives ───────────────────────────────────────────────────────────────

async function syncDeepDives() {
    const posts = await fetchPosts('deep-dive');

    // Group by publication year
    const byYear = {};
    for (const post of posts) {
        const year = new Date(post.published_at).getUTCFullYear().toString();
        if (!byYear[year]) byYear[year] = [];

        const meta     = parseDdMeta(post.codeinjection_head);
        const isLegacy = post.tags?.some(t => t.slug === 'legacy-static');

        byYear[year].push({
            title:   post.title,
            url:     isLegacy
                         ? `/res/deep/${year}/${post.slug}.html`
                         : `/deep-dive.html?slug=${post.slug}`,
            image:   meta.youtubeId
                         ? `https://img.youtube.com/vi/${meta.youtubeId}/maxresdefault.jpg`
                         : '',
            excerpt: post.excerpt || ''
        });
    }

    // Write one JSON file per year
    for (const [year, items] of Object.entries(byYear)) {
        const dir  = path.join('res', 'deep', year);
        fs.mkdirSync(dir, { recursive: true });
        const file = path.join(dir, 'deepdives.json');
        fs.writeFileSync(file, JSON.stringify(items, null, 2) + '\n');
        console.log(`✓  ${file}  (${items.length} posts)`);
    }
}

// ─── Sunday Messages ──────────────────────────────────────────────────────────

async function syncMessages() {
    const posts = await fetchPosts('sunday-message');

    const messages = posts
        .map(post => {
            const meta = parseDdMeta(post.codeinjection_head);
            if (!meta.youtubeId) return null;
            return {
                id:    meta.youtubeId,
                title: post.title,
                date:  formatDate(post.published_at)
            };
        })
        .filter(Boolean);

    fs.writeFileSync('messages.json', JSON.stringify(messages, null, 2) + '\n');
    console.log(`✓  messages.json  (${messages.length} posts)`);
}

// ─── Run ──────────────────────────────────────────────────────────────────────

(async () => {
    console.log('Syncing Ghost CMS data…');
    try {
        await Promise.all([syncDeepDives(), syncMessages()]);
        console.log('Done.');
    } catch (e) {
        console.error('Sync failed:', e.message);
        process.exit(1);
    }
})();
