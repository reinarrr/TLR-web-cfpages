/* ============================================================================
   acts-21-series.js  —  The Living Room
   Shared manifest for the Acts 21 "The Road Less Travelled" deep-dive set.
   (imitatio Christi walked all the way to Jerusalem and the chains.)

   ONE source of truth for the hub panels and every deep dive's cross-nav strip.

   ── RELEASING A STUDY (do both, then push) ──────────────────────────────────
   1. Add the study's HTML file (e.g. all-things-to-all-people.html) to this folder.
   2. Flip its `live` flag below from false to true.
   Push both files. Its panel turns into a live link; until then it stays
   locked and shows "Coming · <date>". (Flag-driven, not server-probed, because
   Cloudflare can answer a missing page with the homepage and falsely unlock.)
   ========================================================================== */

const ACTS21 = {
    base:     '/res/deep/2026/',
    hubSlug:  'the-road-less-travelled',
    hubTitle: 'The Road Less Travelled · Acts 21',
    messages: [
        {
            n: 'I', slug: 'the-lords-will-be-done',
            title: 'The Lord’s Will Be Done', date: 'Aug 9', passage: 'Acts 21:1–16',
            accent: '#46506b', live: true,
            movement: 'Surrender — hands open, eyes open',
            interactive: 'Whose Prayer Is It?'
        },
        {
            n: 'II', slug: 'all-things-to-all-people',
            title: 'All Things to All People', date: 'Aug 16', passage: 'Acts 21:17–26',
            accent: '#9a6f2e', live: true,
            movement: 'Accommodation — freedom that bends low',
            interactive: 'Flint & Water'
        },
        {
            n: 'III', slug: 'kill-him-kill-him',
            title: 'Kill Him, Kill Him', date: 'Aug 23', passage: 'Acts 21:27–40',
            accent: '#8a3a32', live: false,
            movement: 'Arrest — the chains become a pulpit',
            interactive: 'The Three Assumptions'
        }
    ]
};

/* Look up a message by slug. */
function acts21Find(slug) {
    return ACTS21.messages.find(m => m.slug === slug) || null;
}

/* Is a given study live? Driven purely by the explicit flag. */
function acts21IsLive(msg) {
    return !!(msg && msg.live === true);
}

/* ----------------------------------------------------------------------------
   Apply live / locked state to any element carrying [data-acts21-slug].
   - live  → becomes a real link, CTA "Read the deep dive →"
   - locked → no link at all, CTA "Coming · <date>"
   -------------------------------------------------------------------------- */
function acts21DetectLive(root) {
    root = root || document;
    const panels = root.querySelectorAll('[data-acts21-slug]');
    panels.forEach(function (el) {
        const slug = el.getAttribute('data-acts21-slug');
        const fallbackDate = el.getAttribute('data-acts21-date') || '';
        const msg  = acts21Find(slug);
        const live = acts21IsLive(msg);
        const date = (msg && msg.date) || fallbackDate;
        const cta  = el.querySelector('[data-acts21-cta]');
        if (live) {
            if (el.tagName === 'A') el.setAttribute('href', ACTS21.base + slug + '.html');
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
   to the sibling studies. Call once per page with the current study's slug:
       acts21RenderStrip('#series-strip', 'all-things-to-all-people');
   -------------------------------------------------------------------------- */
function acts21RenderStrip(selector, currentSlug) {
    const host = document.querySelector(selector);
    if (!host) return;

    const items = ACTS21.messages.map(function (m) {
        const current = m.slug === currentSlug;
        return `
            <a class="a21-strip-item${current ? ' is-current' : ''}"
               data-acts21-slug="${m.slug}" data-acts21-date="${m.date}"
               style="--accent:${m.accent}">
                <span class="a21-strip-num">${m.n}</span>
                <span class="a21-strip-title">${m.title}</span>
                <span class="a21-strip-cta" data-acts21-cta>Coming · ${m.date}</span>
            </a>`;
    }).join('');

    host.innerHTML = `
        <div class="a21-strip">
            <a class="a21-strip-hub" href="${ACTS21.base + ACTS21.hubSlug}.html">
                <span class="a21-strip-hub-eyebrow">The Series</span>
                <span class="a21-strip-hub-title">${ACTS21.hubTitle}</span>
            </a>
            <div class="a21-strip-list">${items}</div>
        </div>`;

    acts21DetectLive(host);
}
