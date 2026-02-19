/* main.js - The Living Room */
const PROXY_URL = 'https://youtube-proxy.reinar-6fd.workers.dev/';

// 1. Shared Component Loader
async function loadShared() {
    try {
        const [h, f] = await Promise.all([fetch('/components/header.html'), fetch('/components/footer.html')]);
        if (h.ok) document.getElementById('header-placeholder').innerHTML = await h.text();
        if (f.ok) document.getElementById('footer-placeholder').innerHTML = await f.text();
        
        // Handle Active Nav State
        setTimeout(() => {
            const current = document.body.getAttribute('data-current');
            const link = document.querySelector(`[data-page="${current}"]`);
            if (link) link.classList.add('!text-teal');
        }, 150);
    } catch (e) { console.error('Component error:', e); }
}

// 2. Formatting & Logic Helpers
function formatYTDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options).toUpperCase();
}

/**
 * Refined Date Helper: Prioritizes actual broadcast time
 */
function getAccurateDate(video) {
    return video.liveStreamingDetails?.actualStartTime || 
           video.liveStreamingDetails?.scheduledStartTime || 
           video.contentDetails?.videoPublishedAt || 
           video.snippet?.publishedAt;
}

/**
 * STRICT FILTER: Ensures only events that have actually started/finished appear in grids.
 *
 */
function isPastEvent(item) {
    const status = item.snippet?.liveBroadcastContent;
    const scheduledTime = new Date(item.liveStreamingDetails?.scheduledStartTime || item.snippet?.publishedAt);
    const now = new Date();

    if (status === 'upcoming') return false;
    if (scheduledTime > now) return false;

    return true;
}

/**
 * Updated Card Helper for Hybrid Data
 */
function createHybridCard(message, sizeClass) {
    return `
        <a href="https://www.youtube.com/watch?v=${message.id}" target="_blank" class="block group">
            <div class="relative rounded-[2rem] overflow-hidden mb-6 shadow-lg bg-zinc-200 aspect-video">
                <img src="${message.thumbnail}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="${message.title}">
            </div>
            <div class="space-y-3">
                <span class="text-gold text-[0.65rem] font-bold tracking-[0.2em] uppercase">${message.date}</span>
                <h3 class="${sizeClass} font-semibold tracking-tight group-hover:text-teal transition-colors leading-tight">${message.title}</h3>
            </div>
        </a>`;
}

// 3. Global Initializer
window.addEventListener('DOMContentLoaded', () => {
    loadShared();
    if (document.getElementById('youtube-feed')) fetchHomeYouTube();
    if (document.getElementById('latest-container')) fetchReplays(); 
    if (document.getElementById('home-deepdives-grid')) fetchHomeDeepDives();
    if (document.getElementById('library-grid')) loadYear('2026'); 
    if (document.getElementById('devotional-grid')) loadDevotionals(); 
    if (document.getElementById('flex-grid-container')) generateFlexGrid();
    if (document.getElementById('banner-title')) fetchLatestBanner(); // Initialize Resource Banner
});

/**
 * 4. Page Specific: Fetch Homepage YouTube Feed (Hybrid Filtered)
 * Restored the date span to display manual overrides from messages.json.
 */
async function fetchHomeYouTube() {
    const container = document.getElementById('youtube-feed');
    if (!container) return;

    try {
        const [ytRes, jsonRes] = await Promise.all([
            fetch(PROXY_URL),
            fetch('/messages.json').catch(() => ({ ok: false }))
        ]);

        const ytData = await ytRes.json();
        const manualOverrides = jsonRes.ok ? await jsonRes.json() : [];
        
        if (ytData.items) {
            const rawVideos = ytData.items.filter(isPastEvent);

            const mergedHomeVideos = rawVideos.slice(0, 3).map(ytVideo => {
                const videoId = ytVideo.contentDetails?.videoId || ytVideo.id;
                const override = manualOverrides.find(m => m.id === videoId);
                
                return {
                    id: videoId,
                    title: override ? override.title : ytVideo.snippet.title,
                    date: override ? override.date : formatYTDate(getAccurateDate(ytVideo)), // Ensure date is merged
                    thumbnail: ytVideo.snippet.thumbnails.high.url
                };
            });

            // Added the date span back to the return template
            container.innerHTML = mergedHomeVideos.map(item => `
                <a href="https://www.youtube.com/watch?v=${item.id}" target="_blank" class="block group">
                    <div class="relative rounded-[2rem] overflow-hidden mb-8 shadow-xl bg-zinc-200 aspect-video">
                        <img src="${item.thumbnail}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="${item.title}">
                    </div>
                    <div class="space-y-3">
                        <span class="text-gold text-[0.65rem] font-bold tracking-[0.2em] uppercase">${item.date}</span>
                        <h3 class="text-xl font-bold tracking-tight text-charcoal group-hover:text-teal transition-colors leading-tight">${item.title}</h3>
                    </div>
                </a>`).join('');
        }
    } catch (error) { console.error('Home YouTube Error:', error); }
}

// 5. Page Specific: Fetch Homepage Deep Dives
async function fetchHomeDeepDives() {
    const grid = document.getElementById('home-deepdives-grid');
    if (!grid) return;

    try {
        const res = await fetch('/res/deep/2026/deepdives.json');
        if (!res.ok) throw new Error('Deep Dives not found');
        const data = await res.json();
        grid.innerHTML = data.slice(0, 3).map(item => `
            <a href="${item.url || '#'}" class="block group">
                <div class="relative rounded-[2rem] overflow-hidden mb-8 shadow-lg bg-zinc-100 aspect-video">
                    <img src="${item.image || '/img/placeholder.jpg'}" class="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700" alt="${item.title}">
                </div>
                <h3 class="text-xl font-bold group-hover:text-teal transition-colors">${item.title || 'Untitled Study'}</h3>
                <p class="text-zinc-500 text-sm mt-3 line-clamp-2">${item.excerpt || ''}</p>
            </a>
        `).join('');
    } catch (e) { console.error('Deep Dive Query Error:', e); }
}

// 6. Library Specific: Load Deep Dives by Year
async function loadYear(year, button = null) {
    const grid = document.getElementById('library-grid');
    if (!grid) return;
    if (button) {
        document.querySelectorAll('.year-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    }
    try {
        const response = await fetch(`/res/deep/${year}/deepdives.json`);
        if (!response.ok) throw new Error('Archive not found');
        const data = await response.json();
        grid.innerHTML = data.map((item, index) => {
            const isFeatured = index % 3 === 0;
            const colSpan = isFeatured ? 'md:col-span-12 mb-16' : 'md:col-span-6';
            const imgHeight = isFeatured ? 'h-[60vh]' : 'h-[40vh]';
            return `
                <article class="${colSpan}">
                    <a href="${item.url}" class="group block">
                        <div class="relative ${imgHeight} rounded-[3rem] overflow-hidden mb-10 shadow-2xl bg-zinc-100">
                            <img src="${item.image}" class="img-reveal w-full h-full object-cover" alt="${item.title}">
                        </div>
                        <div class="max-w-3xl">
                            <h2 class="${isFeatured ? 'text-4xl md:text-5xl' : 'text-3xl'} font-bold mb-6 group-hover:text-teal transition-colors duration-300">${item.title}</h2>
                            <p class="text-zinc-500 text-lg line-clamp-3 font-light leading-relaxed mb-8">${item.excerpt || ''}</p>
                            <span class="text-gold font-bold uppercase tracking-[0.3em] text-[0.7rem] border-b border-gold pb-1 group-hover:text-teal group-hover:border-teal transition-all">Explore Study &rarr;</span>
                        </div>
                    </a>
                </article>`;
        }).join('');
    } catch (error) { console.error('Library Load Error:', error); }
}

// 7. Devotional Specific: Load Daily Reflections
async function loadDevotionals() {
    const grid = document.getElementById('devotional-grid');
    if (!grid) return;
    try {
        const response = await fetch('/res/dev/devotionals.json');
        if (!response.ok) throw new Error('Devotionals not found');
        const data = await response.json();
        grid.innerHTML = data.map((item, index) => {
            const isFeature = index % 3 === 0;
            const colSpan = isFeature ? 'md:col-span-8' : 'md:col-span-4';
            const imgAspect = isFeature ? 'aspect-[16/8]' : 'aspect-[4/5]';
            const titleSize = isFeature ? 'text-4xl md:text-6xl' : 'text-3xl';
            return `
            <article class="${colSpan} group">
                <a href="${item.url}" class="block no-underline">
                    <div class="relative overflow-hidden mb-10 rounded-sm bg-zinc-100">
                        <img src="${item.image}" class="w-full ${imgAspect} object-cover img-reveal" alt="${item.title}">
                    </div>
                    <div class="${isFeature ? 'max-w-3xl' : ''}">
                        <h2 class="${titleSize} font-bold mb-6 leading-[1.2] text-charcoal group-hover:text-teal transition-colors duration-500 underline-offset-[12px]">${item.title}</h2>
                        <p class="text-zinc-500 ${isFeature ? 'text-xl' : 'text-lg'} leading-relaxed line-clamp-3 font-light mb-8">${item.excerpt}</p>
                    </div>
                </a>
            </article>`;
        }).join('');
    } catch (e) { console.error('Devotional Load Error:', e); }
}

// 8. FortyFlex Specific: Generate 40-Day Grid
function generateFlexGrid() {
    const container = document.getElementById('flex-grid-container');
    if (!container) return;
    let html = '';
    for (let i = 1; i <= 40; i++) {
        let dayNum = i < 10 ? '0' + i : i;
        html += `<a href="res/dev/forty-flex/day-${dayNum}.html" class="day-grid-item py-4 text-center rounded-xl font-bold text-zinc-400 hover:text-gold transition-colors">${i}</a>`;
    }
    container.innerHTML = html;
}

/**
 * 9. Replay Specific: Fetch YouTube Gallery (Hybrid JSON Override)
 * Prioritizes manual entries from messages.json before using YouTube API data.
 */
async function fetchReplays() {
    const latestContainer = document.getElementById('latest-container');
    if (!latestContainer) return;

    try {
        // 1. Fetch both data sources simultaneously
        const [ytRes, jsonRes] = await Promise.all([
            fetch(PROXY_URL),
            fetch('/messages.json').catch(() => ({ ok: false })) // Fallback if file missing
        ]);

        const ytData = await ytRes.json();
        const manualOverrides = jsonRes.ok ? await jsonRes.json() : [];

        if (ytData.items) {
            // 2. Filter out future events
            const rawVideos = ytData.items.filter(isPastEvent);

            // 3. Merge: If a video exists in JSON, use that data; otherwise use YT
            const mergedVideos = rawVideos.map(ytVideo => {
                const videoId = ytVideo.contentDetails?.videoId || ytVideo.id;
                const override = manualOverrides.find(m => m.id === videoId);
                
                return {
                    id: videoId,
                    title: override ? override.title : ytVideo.snippet.title,
                    date: override ? override.date : formatYTDate(getAccurateDate(ytVideo)),
                    thumbnail: ytVideo.snippet.thumbnails.high.url
                };
            });

            if (mergedVideos.length > 0) {
                const latest = mergedVideos[0];
                
                // Render Feature Card
                latestContainer.innerHTML = `
                    <a href="https://www.youtube.com/watch?v=${latest.id}" target="_blank" class="group relative block overflow-hidden rounded-[3rem] shadow-2xl bg-charcoal h-[50vh]">
                        <img src="${latest.thumbnail}" class="w-full h-full object-cover opacity-50 transition-transform duration-1000 group-hover:scale-105" alt="${latest.title}">
                        <div class="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent"></div>
                        <div class="absolute bottom-12 left-10 right-10">
                            <span class="text-gold text-[0.65rem] font-bold tracking-[0.3em] uppercase mb-4 block">${latest.date}</span>
                            <h2 class="text-white text-3xl md:text-5xl font-bold mb-6 leading-tight">${latest.title}</h2>
                            <span class="text-gold font-bold uppercase tracking-[0.3em] text-[0.65rem] border-b border-gold pb-1">Watch Now &rarr;</span>
                        </div>
                    </a>`;

                // Render Grids using the merged data
                document.getElementById('recent-grid').innerHTML = mergedVideos.slice(1, 4).map(v => createHybridCard(v, 'text-xl')).join('');
                document.getElementById('archive-grid').innerHTML = mergedVideos.slice(4, 12).map(v => createHybridCard(v, 'text-sm')).join('');
            }
        }
    } catch (e) { console.error('Error fetching hybrid replays:', e); }
}

/**
 * 10. Resource Specific: Fetch Latest Sunday Message for Banner
 */
async function fetchLatestBanner() {
    const titleEl = document.getElementById('banner-title');
    const imageEl = document.getElementById('banner-image');
    if (!titleEl || !imageEl) return;

    try {
        const response = await fetch(PROXY_URL);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            const latest = data.items[0];
            titleEl.textContent = latest.snippet.title;
            imageEl.src = latest.snippet.thumbnails.high.url;
            imageEl.classList.add('opacity-80');
        }
    } catch (error) { console.error('Banner Update Error:', error); }
}