/* ============================================================================
   acts-20-series.js  —  The Living Room
   Shared manifest for the Acts 20 "The Mirror" deep-dive set (imitatio Christi).

   ONE source of truth for the hub panels and every deep dive's cross-nav strip,
   so the four pages always point back to each other correctly.

   ── RELEASING A STUDY (do both, then push) ──────────────────────────────────
   1. Add the study's HTML file (e.g. finish-the-race.html) to this folder.
   2. Flip its `live` flag below from false to true.
   Push both files. Its panel turns into a live link; until then it stays
   locked and shows "Coming · <date>". (We drive this from the flag rather than
   probing the server, because Cloudflare can answer a missing page with the
   homepage — which would falsely unlock a tile.)
   ========================================================================== */

const ACTS20 = {
    base:     '/res/deep/2026/',
    hubSlug:  'the-mirror',
    hubTitle: 'The Mirror · Acts 20',
    messages: [
        {
            n: 'I', slug: 'life-in-the-room',
            title: 'Life in the Room', date: 'Jul 12', passage: 'Acts 20:7–12',
            accent: '#2d5a5a', live: true,
            movement: 'His resurrection life in the ordinary room',
            interactive: 'The Boy in the Window'
        },
        {
            n: 'II', slug: 'finish-the-race',
            title: 'Finish the Race', date: 'Jul 19', passage: 'Acts 20:17–24',
            accent: '#5a7a60', live: true,
            movement: 'His faithfulness, run to the line',
            interactive: 'The Course'
        },
        {
            n: 'III', slug: 'the-shepherds-love',
            title: 'The Shepherd’s Love', date: 'Jul 26', passage: 'Acts 20:25–31',
            accent: '#c06a4d', live: true,
            movement: 'His death — the flock bought with blood',
            interactive: 'The Purchase'
        },
        {
            n: 'IV', slug: 'leaving-like-jesus-left',
            title: 'Leaving Like Jesus Left', date: 'Aug 2', passage: 'Acts 20:32–38',
            accent: '#a8843d', live: true,
            movement: 'His manner of leaving in us',
            interactive: 'The Agraphon'
        }
    ]
};

/* Look up a message by slug. */
function acts20Find(slug) {
    return ACTS20.messages.find(m => m.slug === slug) || null;
}

/* Is a given study live? Driven purely by the explicit flag. */
function acts20IsLive(msg) {
    return !!(msg && msg.live === true);
}

/* ----------------------------------------------------------------------------
   Apply live / locked state to any element carrying [data-acts20-slug].
   - live  → becomes a real link, CTA "Read the deep dive →"
   - locked → no link at all (won't navigate), CTA "Coming · <date>"
   Used by both the hub panels and the deep-dive cross-nav strip.
   -------------------------------------------------------------------------- */
function acts20DetectLive(root) {
    root = root || document;
    const panels = root.querySelectorAll('[data-acts20-slug]');
    panels.forEach(function (el) {
        const slug = el.getAttribute('data-acts20-slug');
        const fallbackDate = el.getAttribute('data-acts20-date') || '';
        const msg  = acts20Find(slug);
        const live = acts20IsLive(msg);
        const date = (msg && msg.date) || fallbackDate;
        const cta  = el.querySelector('[data-acts20-cta]');
        if (live) {
            if (el.tagName === 'A') el.setAttribute('href', ACTS20.base + slug + '.html');
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
       acts20RenderStrip('#series-strip', 'finish-the-race');
   -------------------------------------------------------------------------- */
function acts20RenderStrip(selector, currentSlug) {
    const host = document.querySelector(selector);
    if (!host) return;

    const items = ACTS20.messages.map(function (m) {
        const current = m.slug === currentSlug;
        return `
            <a class="a20-strip-item${current ? ' is-current' : ''}"
               data-acts20-slug="${m.slug}" data-acts20-date="${m.date}"
               style="--accent:${m.accent}">
                <span class="a20-strip-num">${m.n}</span>
                <span class="a20-strip-title">${m.title}</span>
                <span class="a20-strip-cta" data-acts20-cta>Coming · ${m.date}</span>
            </a>`;
    }).join('');

    host.innerHTML = `
        <div class="a20-strip">
            <a class="a20-strip-hub" href="${ACTS20.base + ACTS20.hubSlug}.html">
                <span class="a20-strip-hub-eyebrow">The Series</span>
                <span class="a20-strip-hub-title">${ACTS20.hubTitle}</span>
            </a>
            <div class="a20-strip-list">${items}</div>
        </div>`;

    acts20DetectLive(host);
}
