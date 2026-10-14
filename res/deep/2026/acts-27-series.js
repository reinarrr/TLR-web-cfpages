/* ============================================================================
   acts-27-series.js  —  The Living Room
   Shared manifest for the Acts 27 "The Voyage" deep-dive set.
   (Nobody chose this crew. Nobody could leave it. And every one came ashore.)

   ONE source of truth for the hub exhibits and every deep dive's cross-nav strip.

   ── RELEASING A STUDY (do both, then push) ──────────────────────────────────
   1. Add the study's HTML file (e.g. the-experts-were-wrong.html).
   2. Flip its `live` flag below from false to true, and unlock its hub panel
      (is-locked → is-live + href + CTA) in the-voyage.html.
   Push both files. Flag-driven, not server-probed.
   ========================================================================== */

const ACTS27 = {
    base:     '/res/deep/2026/',
    hubSlug:  'the-voyage',
    hubTitle: 'The Voyage · Acts 27',
    messages: [
        {
            n: 'I', slug: 'the-experts-were-wrong',
            title: 'The Experts Were Wrong', date: 'Oct 18', passage: 'Acts 27:1–26',
            accent: '#c5984a', live: false,
            claim: 'When the room is wrong, who do you believe?',
            interactive: 'Everything Over the Side'
        },
        {
            n: 'II', slug: 'he-took-some-bread',
            title: 'He Took Some Bread', date: 'Oct 25', passage: 'Acts 27:27–44',
            accent: '#c5984a', live: false,
            claim: 'What does faith look like on the fourteenth night?',
            interactive: 'Took · Gave Thanks · Broke'
        }
    ]
};

/* Look up a message by slug. */
function acts27Find(slug) {
    return ACTS27.messages.find(m => m.slug === slug) || null;
}

/* Is a given study live? Driven purely by the explicit flag. */
function acts27IsLive(msg) {
    return !!(msg && msg.live === true);
}

/* ----------------------------------------------------------------------------
   Apply live / locked state to any element carrying [data-acts27-slug].
   - live  → becomes a real link, CTA "Read the deep dive →"
   - locked → no link at all, CTA "Coming · <date>"
   -------------------------------------------------------------------------- */
function acts27DetectLive(root) {
    root = root || document;
    const panels = root.querySelectorAll('[data-acts27-slug]');
    panels.forEach(function (el) {
        const slug = el.getAttribute('data-acts27-slug');
        const fallbackDate = el.getAttribute('data-acts27-date') || '';
        const msg  = acts27Find(slug);
        const live = acts27IsLive(msg);
        const date = (msg && msg.date) || fallbackDate;
        const cta  = el.querySelector('[data-acts27-cta]');
        if (live) {
            if (el.tagName === 'A') el.setAttribute('href', ACTS27.base + slug + '.html');
            el.classList.add('is-live');
            el.classList.remove('is-locked');
            if (cta) cta.textContent = 'Read the deep dive →';
        } else {
            el.removeAttribute('href');
            el.classList.add('is-locked');
            el.classList.remove('is-live');
            if (cta) cta.textContent = date ? ('Coming · ' + date) : 'Coming soon';
        }
    });
}

/* ----------------------------------------------------------------------------
   DEEP-DIVE PAGES — render a compact cross-nav strip back to the hub and across
   to the sibling study. Call once per page with the current study's slug:
       acts27RenderStrip('#series-strip', 'he-took-some-bread');
   -------------------------------------------------------------------------- */
function acts27RenderStrip(selector, currentSlug) {
    const host = document.querySelector(selector);
    if (!host) return;

    const items = ACTS27.messages.map(function (m) {
        const current = m.slug === currentSlug;
        return `
            <a class="a27-strip-item${current ? ' is-current' : ''}"
               data-acts27-slug="${m.slug}" data-acts27-date="${m.date}">
                <span class="a27-strip-num">Exhibit ${m.n}</span>
                <span class="a27-strip-title">${m.title}</span>
                <span class="a27-strip-cta" data-acts27-cta>Coming · ${m.date}</span>
            </a>`;
    }).join('');

    host.innerHTML = `
        <div class="a27-strip">
            <a class="a27-strip-hub" href="${ACTS27.base + ACTS27.hubSlug}.html">
                <span class="a27-strip-hub-eyebrow">The Voyage</span>
                <span class="a27-strip-hub-title">${ACTS27.hubTitle}</span>
            </a>
            <div class="a27-strip-list">${items}</div>
        </div>`;

    acts27DetectLive(host);
}
