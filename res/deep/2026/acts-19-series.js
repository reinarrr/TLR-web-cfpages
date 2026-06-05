/* ============================================================================
   acts-19-series.js  —  The Living Room
   Shared manifest for the Acts 19 "Power Capital" deep-dive set.

   ONE source of truth for the hub panels and every deep dive's cross-nav strip,
   so the five pages always point back to each other correctly.

   RELEASE MODEL — week by week, zero maintenance:
   The studies ship one Sunday at a time. Live state is AUTO-DETECTED: a panel
   unlocks the moment its HTML file is actually deployed (a HEAD request finds it).
   There are no flags to flip when you publish — just drop the file and push.

   (To force a state while testing, add `live: true` or `live: false` to a
    message below. Otherwise leave it off and detection handles it.)
   ========================================================================== */

const ACTS19 = {
    base:     '/res/deep/2026/',
    hubSlug:  'ephesus-power-capital',
    hubTitle: 'Ephesus · The Power Capital',
    messages: [
        {
            n: 'I', slug: 'have-you-received',
            title: 'Have You Received?', date: 'Jun 7', passage: 'Acts 19:1–7',
            accent: '#3d8080',
            movement: 'The Spirit, received in full',
            counterfeit: 'A half-received faith', authentic: 'The Spirit in full',
            interactive: 'In the Room or the Doorway?'
        },
        {
            n: 'II', slug: 'the-borrowed-room',
            title: 'The Borrowed Room', date: 'Jun 14', passage: 'Acts 19:8–10',
            accent: '#6a8f70',
            movement: 'The gospel moves to ordinary space',
            counterfeit: 'Only the “proper” space counts', authentic: 'The borrowed room',
            interactive: 'From One Room, a Whole Province'
        },
        {
            n: 'III', slug: 'borrowed-credentials',
            title: 'Borrowed Credentials', date: 'Jun 21', passage: 'Acts 19:13–20',
            accent: '#a35545',
            movement: 'The Name can’t be hijacked',
            counterfeit: 'The Name as a formula', authentic: 'Belonging to the Person',
            interactive: 'The Descending Scale'
        },
        {
            n: 'IV', slug: 'manufactured-outrage',
            title: 'Manufactured Outrage', date: 'Jun 28', passage: 'Acts 19:23–41',
            accent: '#5a7aa0',
            movement: 'Counterfeit unity collapses',
            counterfeit: 'The unity of the crowd', authentic: 'The unity of the Spirit',
            interactive: 'Two Crowds'
        },
        {
            n: 'V', slug: 'little-man-limitless-horizon',
            title: 'Little Man, Limitless Horizon', date: 'Jul 5', passage: 'Acts 19:21–22',
            accent: '#c5a059', bridge: true,
            movement: 'The love that compels the gospel outward',
            counterfeit: 'Making a name for ourselves', authentic: 'Spending the self',
            interactive: 'The Endless Horizon'
        }
    ]
};

/* Look up a message by slug. */
function acts19Find(slug) {
    return ACTS19.messages.find(m => m.slug === slug) || null;
}

/* Is a given study live? Honour an explicit `live` flag; otherwise probe the file. */
async function acts19IsLive(msg) {
    if (typeof msg.live === 'boolean') return msg.live;
    try {
        const r = await fetch(ACTS19.base + msg.slug + '.html', { method: 'HEAD' });
        return r.ok;
    } catch (e) { return false; }
}

/* ----------------------------------------------------------------------------
   HUB — upgrade locked panels to live as their files appear.
   Any element carrying [data-acts19-slug] is treated as a panel; its inner
   [data-acts19-cta] gets the right call-to-action. Locked by default so a
   missing file never renders a broken link.
   -------------------------------------------------------------------------- */
async function acts19DetectLive(root) {
    root = root || document;
    const panels = Array.prototype.slice.call(root.querySelectorAll('[data-acts19-slug]'));
    await Promise.all(panels.map(async (el) => {
        const slug = el.getAttribute('data-acts19-slug');
        const date = el.getAttribute('data-acts19-date') || '';
        const msg  = acts19Find(slug) || { slug, date };
        const live = await acts19IsLive(msg);
        const cta  = el.querySelector('[data-acts19-cta]');
        if (live) {
            if (el.tagName === 'A') el.setAttribute('href', ACTS19.base + slug + '.html');
            el.classList.add('is-live');
            el.classList.remove('is-locked');
            if (cta) cta.textContent = 'Read the deep dive →';
        } else {
            if (el.tagName === 'A') el.removeAttribute('href');
            el.classList.add('is-locked');
            el.classList.remove('is-live');
            if (cta) cta.textContent = date ? ('Drops the week of ' + date) : 'Coming soon';
        }
    }));
}

/* ----------------------------------------------------------------------------
   DEEP-DIVE PAGES — render a compact cross-nav strip that points back to the
   hub and across to the sibling studies (live ones link; upcoming ones show
   their drop week). Call once on a page, passing the current study's slug:

       acts19RenderStrip('#series-strip', 'manufactured-outrage');
   -------------------------------------------------------------------------- */
function acts19RenderStrip(selector, currentSlug) {
    const host = document.querySelector(selector);
    if (!host) return;

    const dots = ACTS19.messages.map(m => {
        const current = m.slug === currentSlug;
        return `
            <a class="a19-strip-item${current ? ' is-current' : ''}"
               data-acts19-slug="${m.slug}" data-acts19-date="${m.date}"
               style="--accent:${m.accent}">
                <span class="a19-strip-num">${m.n}</span>
                <span class="a19-strip-title">${m.title}</span>
                <span class="a19-strip-cta" data-acts19-cta>Drops the week of ${m.date}</span>
            </a>`;
    }).join('');

    host.innerHTML = `
        <div class="a19-strip">
            <a class="a19-strip-hub" href="${ACTS19.base + ACTS19.hubSlug}.html">
                <span class="a19-strip-hub-eyebrow">The Series</span>
                <span class="a19-strip-hub-title">${ACTS19.hubTitle}</span>
            </a>
            <div class="a19-strip-list">${dots}</div>
        </div>`;

    acts19DetectLive(host);
}
