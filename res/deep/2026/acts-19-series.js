/* ============================================================================
   acts-19-series.js  —  The Living Room
   Shared manifest for the Acts 19 "Power Capital" deep-dive set.

   ONE source of truth for the hub panels and every deep dive's cross-nav strip,
   so the five pages always point back to each other correctly.

   ── RELEASING A STUDY (do both, then push) ──────────────────────────────────
   1. Add the study's HTML file (e.g. the-borrowed-room.html) to this folder.
   2. Flip its `live` flag below from false to true.
   Push both files. Its panel turns into a live link; until then it stays
   locked and shows "Coming · <date>". (We drive this from the flag rather than
   probing the server, because Cloudflare can answer a missing page with the
   homepage — which would falsely unlock a tile.)
   ========================================================================== */

const ACTS19 = {
    base:     '/res/deep/2026/',
    hubSlug:  'ephesus-power-capital',
    hubTitle: 'Ephesus · The Power Capital',
    messages: [
        {
            n: 'I', slug: 'have-you-received',
            title: 'Have You Received?', date: 'Jun 7', passage: 'Acts 19:1–7',
            accent: '#2d5a5a', live: true,
            movement: 'The Spirit, received in full',
            interactive: 'In the Room or the Doorway?'
        },
        {
            n: 'II', slug: 'the-borrowed-room',
            title: 'The Borrowed Room', date: 'Jun 14', passage: 'Acts 19:8–10',
            accent: '#5a7a60', live: true,
            movement: 'The gospel moves to ordinary space',
            interactive: 'From One Room, a Whole Province'
        },
        {
            n: 'III', slug: 'borrowed-credentials',
            title: 'Borrowed Credentials', date: 'Jun 21', passage: 'Acts 19:13–20',
            accent: '#c06a4d', live: true,
            movement: 'The Name can’t be hijacked',
            interactive: 'The Descending Scale'
        },
        {
            n: 'IV', slug: 'manufactured-outrage',
            title: 'Manufactured Outrage', date: 'Jun 28', passage: 'Acts 19:23–41',
            accent: '#4a6f99', live: true,
            movement: 'Counterfeit unity collapses',
            interactive: 'Two Crowds'
        },
        {
            n: 'V', slug: 'little-man-limitless-horizon',
            title: 'Little Man, Limitless Horizon', date: 'Jul 5', passage: 'Acts 19:21–22',
            accent: '#c5a059', live: false, bridge: true,
            movement: 'The love that compels the gospel outward',
            interactive: 'The Endless Horizon'
        }
    ]
};

/* Look up a message by slug. */
function acts19Find(slug) {
    return ACTS19.messages.find(m => m.slug === slug) || null;
}

/* Is a given study live? Driven purely by the explicit flag. */
function acts19IsLive(msg) {
    return !!(msg && msg.live === true);
}

/* ----------------------------------------------------------------------------
   Apply live / locked state to any element carrying [data-acts19-slug].
   - live  → becomes a real link, CTA "Read the deep dive →"
   - locked → no link at all (won't navigate), CTA "Coming · <date>"
   Used by both the hub panels and the deep-dive cross-nav strip.
   -------------------------------------------------------------------------- */
function acts19DetectLive(root) {
    root = root || document;
    const panels = root.querySelectorAll('[data-acts19-slug]');
    panels.forEach(function (el) {
        const slug = el.getAttribute('data-acts19-slug');
        const fallbackDate = el.getAttribute('data-acts19-date') || '';
        const msg  = acts19Find(slug);
        const live = acts19IsLive(msg);
        const date = (msg && msg.date) || fallbackDate;
        const cta  = el.querySelector('[data-acts19-cta]');
        if (live) {
            if (el.tagName === 'A') el.setAttribute('href', ACTS19.base + slug + '.html');
            el.classList.add('is-live');
            el.classList.remove('is-locked');
            if (cta) cta.textContent = 'Read the deep dive →';
        } else {
            el.removeAttribute('href');         // genuinely not a link
            el.classList.add('is-locked');
            el.classList.remove('is-live');
            if (cta) cta.textContent = date ? ('Coming · ' + date) : 'Coming soon';
        }
    });
}

/* ----------------------------------------------------------------------------
   DEEP-DIVE PAGES — render a compact cross-nav strip back to the hub and across
   to the sibling studies. Call once per page with the current study's slug:
       acts19RenderStrip('#series-strip', 'manufactured-outrage');
   -------------------------------------------------------------------------- */
function acts19RenderStrip(selector, currentSlug) {
    const host = document.querySelector(selector);
    if (!host) return;

    const items = ACTS19.messages.map(function (m) {
        const current = m.slug === currentSlug;
        return `
            <a class="a19-strip-item${current ? ' is-current' : ''}"
               data-acts19-slug="${m.slug}" data-acts19-date="${m.date}"
               style="--accent:${m.accent}">
                <span class="a19-strip-num">${m.n}</span>
                <span class="a19-strip-title">${m.title}</span>
                <span class="a19-strip-cta" data-acts19-cta>Coming · ${m.date}</span>
            </a>`;
    }).join('');

    host.innerHTML = `
        <div class="a19-strip">
            <a class="a19-strip-hub" href="${ACTS19.base + ACTS19.hubSlug}.html">
                <span class="a19-strip-hub-eyebrow">The Series</span>
                <span class="a19-strip-hub-title">${ACTS19.hubTitle}</span>
            </a>
            <div class="a19-strip-list">${items}</div>
        </div>`;

    acts19DetectLive(host);
}
