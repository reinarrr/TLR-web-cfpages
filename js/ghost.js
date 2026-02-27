/* ghost.js - Ghost CMS Integration | The Living Room */

const GHOST_URL = 'https://ghost-proxy.reinar-6fd.workers.dev';
const GHOST_KEY = 'c306251d7f0f57012025d2fdc4';
const GHOST_API = `${GHOST_URL}/ghost/api/content`;

// ---------------------------------------------------------------------------
// 1. API Fetchers
// ---------------------------------------------------------------------------

/**
 * Fetch all deep-dive posts, optionally filtered to a specific year.
 * Year filtering is done client-side to avoid NQL date operators in the URL
 * which can trigger WAF rules on the proxy.
 */
async function fetchGhostDeepDives(year = null) {
    const url = `${GHOST_API}/posts/?key=${GHOST_KEY}` +
        `&filter=tag%3Adeep-dive` +
        `&include=tags` +
        `&order=published_at%20desc` +
        `&limit=all`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ghost API ${res.status}`);
    const data = await res.json();
    const posts = data.posts || [];

    // Filter by year client-side if requested
    if (year) {
        return posts.filter(p => new Date(p.published_at).getFullYear() === parseInt(year));
    }
    return posts;
}

/**
 * Fetch a single post by slug, including full HTML and code injection.
 */
async function fetchGhostPost(slug) {
    const url = `${GHOST_API}/posts/slug/${slug}/?key=${GHOST_KEY}` +
        `&include=tags` +
        `&formats=html`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ghost API ${res.status}`);
    const data = await res.json();
    if (!data.posts || !data.posts[0]) throw new Error('Post not found');
    return data.posts[0];
}

// ---------------------------------------------------------------------------
// 2. Helpers
// ---------------------------------------------------------------------------

/**
 * Parse the dd-meta JSON blob from a post's codeinjection_head.
 * Returns an object with: youtubeId, scripture, scriptureUrl, seriesLabel, videoCaption
 */
function parseDdMeta(codeinjectionHead) {
    if (!codeinjectionHead) return {};
    const match = codeinjectionHead.match(/<script[^>]*id="dd-meta"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return {};
    try { return JSON.parse(match[1].trim()); } catch (e) { return {}; }
}

/**
 * Resolve the correct URL for a listing card.
 * Posts tagged 'legacy-static' use their canonical_url (the existing static .html file).
 * All other posts route through the dynamic /deep-dive.html template.
 */
function getDeepDiveUrl(post) {
    const isLegacy = post.tags?.some(t => t.slug === 'legacy-static');
    if (isLegacy) {
        if (post.canonical_url) return post.canonical_url;
        // Derive path from publish year + slug (e.g. 2026 + redlight-greenlight → /res/deep/2026/redlight-greenlight.html)
        const year = post.published_at ? new Date(post.published_at).getFullYear() : '2026';
        return `/res/deep/${year}/${post.slug}.html`;
    }
    return `/deep-dive.html?slug=${post.slug}`;
}

/**
 * Map a Ghost post to the flat card shape used by the listing renderers.
 * Falls back to the YouTube maxresdefault thumbnail if no feature image is set.
 */
function ghostPostToCard(post) {
    const meta = parseDdMeta(post.codeinjection_head);
    const ytFallback = meta.youtubeId
        ? `https://img.youtube.com/vi/${meta.youtubeId}/maxresdefault.jpg`
        : '';
    return {
        title: post.title,
        url: getDeepDiveUrl(post),
        image: post.feature_image || ytFallback,
        excerpt: post.custom_excerpt || ''
    };
}

/**
 * Fetch all sunday-message posts and map them to the message card shape
 * used by the replays page, home YouTube feed, and resources banner.
 * Returns: [{ id, title, publishedAt, thumbnail }]
 *
 * sunday-message is a lightweight tag applied immediately after every Sunday
 * service — it only requires a title, youtubeId in dd-meta, and a publish date.
 * The deep-dive tag is added separately, later, when the full study is ready.
 *
 * Posts without a youtubeId in dd-meta are silently skipped.
 */
async function fetchGhostMessages() {
    const url = `${GHOST_API}/posts/?key=${GHOST_KEY}` +
        `&filter=tag%3Asunday-message` +
        `&order=published_at%20desc` +
        `&limit=all`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ghost API ${res.status}`);
    const data = await res.json();
    const posts = data.posts || [];

    return posts
        .map(post => {
            const meta = parseDdMeta(post.codeinjection_head);
            if (!meta.youtubeId) return null;
            return {
                id: meta.youtubeId,
                title: post.title,
                publishedAt: post.published_at,
                thumbnail: `https://img.youtube.com/vi/${meta.youtubeId}/maxresdefault.jpg`
            };
        })
        .filter(Boolean);
}

// ---------------------------------------------------------------------------
// 3. Page Renderer (for /deep-dive.html)
// ---------------------------------------------------------------------------

/**
 * Build the full deep-dive page HTML from a Ghost post + dd-meta.
 * Mirrors the structure of the existing static deep-dive pages.
 */
function renderDeepDive(post, meta) {
    const seriesLabel  = meta.seriesLabel  || 'Deep Dive';
    const scripture    = meta.scripture    || '';
    const scriptureUrl = meta.scriptureUrl || '#';
    const youtubeId    = meta.youtubeId    || '';
    const videoCaption = meta.videoCaption || 'Watch the foundation message';

    const scriptureSection = scripture ? `
        <section class="max-w-2xl mx-auto text-center mb-24">
            <h4 class="text-gold text-[0.65rem] font-bold tracking-[0.4em] uppercase mb-4">The Foundation</h4>
            <h2 class="text-3xl font-bold mb-6 italic">${scripture}</h2>
            <a href="${scriptureUrl}" target="_blank" rel="noopener"
               class="text-teal font-bold uppercase tracking-[0.2em] text-[0.7rem] border-b border-teal/30 pb-1 hover:text-gold hover:border-gold transition-all">
                Read on Bible Gateway &rarr;
            </a>
        </section>` : '';

    const youtubeSection = youtubeId ? `
        <section class="mb-32">
            <div class="relative rounded-[3rem] overflow-hidden shadow-2xl bg-zinc-200 aspect-video">
                <iframe class="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/${youtubeId}"
                    title="${post.title}"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen></iframe>
            </div>
            <p class="text-center text-zinc-400 text-[0.65rem] mt-8 tracking-[0.3em] uppercase italic">${videoCaption}</p>
        </section>` : '';

    const excerptHtml = post.custom_excerpt ? `
        <p class="text-2xl md:text-3xl text-charcoal font-light leading-relaxed italic lead-quote pl-8 text-left mx-auto max-w-3xl py-4">
            &ldquo;${post.custom_excerpt}&rdquo;
        </p>` : '';

    return `
        <header class="text-center mb-20 editorial-header pb-16">
            <h3 class="text-gold text-[0.7rem] font-bold tracking-[0.5em] uppercase mb-8">${seriesLabel}</h3>
            <h1 class="text-6xl md:text-8xl font-bold mb-10 leading-[1.05] tracking-tight text-charcoal">
                ${post.title}.
            </h1>
            ${excerptHtml}
        </header>

        ${scriptureSection}
        ${youtubeSection}

        <article class="space-y-24 mb-32 ghost-content">
            ${post.html || ''}
        </article>

        <div class="mt-16 text-center border-t border-zinc-100 pt-16">
            <a href="/deepdives.html"
               class="inline-block border border-teal text-teal px-12 py-4 rounded-full font-bold uppercase tracking-[0.2em] text-[0.7rem] hover:bg-teal hover:text-white transition-all">
                &larr; Back to Library
            </a>
        </div>
    `;
}

// ---------------------------------------------------------------------------
// 4. Page Bootstrap (runs on /deep-dive.html)
// ---------------------------------------------------------------------------

async function initDeepDivePage() {
    const content = document.getElementById('dd-content');
    const loading = document.getElementById('dd-loading');
    if (!content) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        loading.innerHTML = '<p class="text-zinc-400 text-center py-40">No study specified.</p>';
        return;
    }

    try {
        const post = await fetchGhostPost(slug);
        const meta = parseDdMeta(post.codeinjection_head);

        document.title = `${post.title} | Deep Dive`;

        // Update og meta if present
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.content = post.title;

        content.innerHTML = renderDeepDive(post, meta);
        loading.classList.add('hidden');
        content.classList.remove('hidden');
    } catch (e) {
        console.error('Ghost deep dive error:', e);
        loading.innerHTML = `
            <div class="text-center py-40">
                <p class="text-zinc-400 mb-6">This study couldn&rsquo;t be loaded.</p>
                <a href="/deepdives.html" class="text-teal font-bold uppercase tracking-[0.2em] text-[0.7rem] border-b border-teal pb-1">
                    &larr; Back to Library
                </a>
            </div>`;
    }
}

// ---------------------------------------------------------------------------
// 5. Init
// ---------------------------------------------------------------------------

window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dd-content')) initDeepDivePage();
});
