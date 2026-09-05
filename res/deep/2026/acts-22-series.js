/* ============================================================================
   acts-22-series.js  —  The Living Room
   Shared manifest for the Acts 22–26 "The Gospel on Trial" deep-dive set.
   (Paul in the dock — but it is really the gospel that is on trial. — Hamm)

   ONE source of truth for the hub exhibits and every deep dive's cross-nav strip.

   ── RELEASING A STUDY (do both, then push) ──────────────────────────────────
   1. Add the study's HTML file (e.g. a-council-versus-one-sentence.html).
   2. Flip its `live` flag below from false to true, and unlock its hub panel
      (is-locked → is-live + href + CTA) in the-gospel-on-trial.html.
   Push both files. Flag-driven, not server-probed (Cloudflare can answer a
   missing page with the homepage and falsely unlock).
   ========================================================================== */

const ACTS22 = {
    base:     '/res/deep/2026/',
    hubSlug:  'the-gospel-on-trial',
    hubTitle: 'The Gospel on Trial · Acts 22–26',
    messages: [
        {
            n: 'I', slug: 'nobody-said-a-word',
            title: 'Nobody Said a Word', date: 'Aug 30', passage: 'Acts 22:1–29',
            accent: '#b0281f', live: true,
            claim: 'Can a changed life be evidence?',
            interactive: 'A Life Can’t Be Cross-Examined'
        },
        {
            n: 'II', slug: 'a-council-versus-one-sentence',
            title: 'A Council Versus One Sentence', date: 'Sep 6', passage: 'Acts 22:30 – 23:11',
            accent: '#b0281f', live: true,
            claim: 'Did the dead man rise?',
            interactive: 'The Word That Split the Court'
        },
        {
            n: 'III', slug: 'forty-men-versus-one-boy',
            title: 'Forty Men Versus One Boy', date: 'Sep 13', passage: 'Acts 23:12–35',
            accent: '#b0281f', live: false,
            claim: 'Is a hidden hand still a hand?',
            interactive: 'The Invisible Hand'
        },
        {
            n: 'IV', slug: 'a-more-convenient-season',
            title: 'A More Convenient Season', date: 'Sep 20', passage: 'Acts 24:1–27',
            accent: '#b0281f', live: false,
            claim: 'Why couldn’t God just forgive?',
            interactive: 'The Most Expensive Word'
        },
        {
            n: 'V', slug: 'a-certain-jesus',
            title: 'A Certain Jesus', date: 'Sep 27', passage: 'Acts 25:1–27',
            accent: '#b0281f', live: false,
            claim: 'Dead — or alive?',
            interactive: 'The Cross-Examination'
        },
        {
            n: 'VI', slug: 'except-for-these-chains',
            title: 'Except For These Chains', date: 'Oct 4', passage: 'Acts 26:1–32',
            accent: '#b0281f', live: false,
            claim: 'What is the verdict on you?',
            interactive: 'Almost Persuaded'
        }
    ]
};

/* Look up a message by slug. */
function acts22Find(slug) {
    return ACTS22.messages.find(m => m.slug === slug) || null;
}

/* Is a given study live? Driven purely by the explicit flag. */
function acts22IsLive(msg) {
    return !!(msg && msg.live === true);
}

/* ----------------------------------------------------------------------------
   Apply live / locked state to any element carrying [data-acts22-slug].
   - live  → becomes a real link, CTA "Read the deep dive →"
   - locked → no link at all, CTA "Coming · <date>"
   -------------------------------------------------------------------------- */
function acts22DetectLive(root) {
    root = root || document;
    const panels = root.querySelectorAll('[data-acts22-slug]');
    panels.forEach(function (el) {
        const slug = el.getAttribute('data-acts22-slug');
        const fallbackDate = el.getAttribute('data-acts22-date') || '';
        const msg  = acts22Find(slug);
        const live = acts22IsLive(msg);
        const date = (msg && msg.date) || fallbackDate;
        const cta  = el.querySelector('[data-acts22-cta]');
        if (live) {
            if (el.tagName === 'A') el.setAttribute('href', ACTS22.base + slug + '.html');
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
       acts22RenderStrip('#series-strip', 'a-certain-jesus');
   -------------------------------------------------------------------------- */
function acts22RenderStrip(selector, currentSlug) {
    const host = document.querySelector(selector);
    if (!host) return;

    const items = ACTS22.messages.map(function (m) {
        const current = m.slug === currentSlug;
        return `
            <a class="a22-strip-item${current ? ' is-current' : ''}"
               data-acts22-slug="${m.slug}" data-acts22-date="${m.date}">
                <span class="a22-strip-num">Exhibit ${m.n}</span>
                <span class="a22-strip-title">${m.title}</span>
                <span class="a22-strip-cta" data-acts22-cta>Coming · ${m.date}</span>
            </a>`;
    }).join('');

    host.innerHTML = `
        <div class="a22-strip">
            <a class="a22-strip-hub" href="${ACTS22.base + ACTS22.hubSlug}.html">
                <span class="a22-strip-hub-eyebrow">The Case</span>
                <span class="a22-strip-hub-title">${ACTS22.hubTitle}</span>
            </a>
            <div class="a22-strip-list">${items}</div>
        </div>`;

    acts22DetectLive(host);
}
