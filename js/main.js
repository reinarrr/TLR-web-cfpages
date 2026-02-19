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

// 2. Formatting Helpers
function formatYTDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options).toUpperCase();
}

// 3. Global Initializer
window.addEventListener('DOMContentLoaded', () => {
    loadShared();
    // Auto-run page specific logic if container exists
    if (document.getElementById('youtube-feed')) fetchHomeYouTube();
    if (document.getElementById('latest-container')) fetchReplayGallery();
});

// 4. Page Specific: Fetch Homepage YouTube Feed
async function fetchHomeYouTube() {
    const container = document.getElementById('youtube-feed');
    if (!container) return; // Safety check

    try {
        const response = await fetch(PROXY_URL);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            container.innerHTML = data.items.slice(0, 3).map(item => {
                const originalDate = item.contentDetails.videoPublishedAt || item.snippet.publishedAt;
                const dateMeta = formatYTDate(originalDate);
                const videoId = item.contentDetails.videoId; 
                
                return `
                <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="block group">
                    <div class="relative rounded-[2rem] overflow-hidden mb-8 shadow-xl bg-zinc-200 aspect-video">
                        <img src="${item.snippet.thumbnails.high.url}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="${item.snippet.title}">
                    </div>
                    <div class="space-y-3">
                        <span class="text-gold text-[0.65rem] font-bold tracking-[0.2em] uppercase">${dateMeta}</span>
                        <h3 class="text-xl font-bold tracking-tight text-charcoal group-hover:text-teal transition-colors leading-tight">${item.snippet.title}</h3>
                    </div>
                </a>`;
            }).join('');
        }
    } catch (error) { console.error('YouTube Fetch Error:', error); }
}

// 5. Page Specific: Fetch Homepage Deep Dives
async function fetchHomeDeepDives() {
    const grid = document.getElementById('home-deepdives-grid');
    if (!grid) return;

    try {
        const res = await fetch('/res/deep/2026/deepdives.json');
        
        // Check if the file actually exists
        if (!res.ok) {
            console.error(`JSON not found at /res/deep/2026/deepdives.json. Status: ${res.status}`);
            return;
        }

        const data = await res.json();
        
        // Filter out any undefined items to prevent crashes
        grid.innerHTML = data.slice(0, 3).map(item => `
            <a href="${item.url || '#'}" class="block group">
                <div class="relative rounded-[2rem] overflow-hidden mb-8 shadow-lg bg-zinc-100 aspect-video">
                    <img src="${item.image || '/img/placeholder.jpg'}" class="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700" alt="${item.title}">
                </div>
                <h3 class="text-xl font-bold group-hover:text-teal transition-colors">${item.title || 'Untitled Study'}</h3>
                <p class="text-zinc-500 text-sm mt-3 line-clamp-2">${item.excerpt || ''}</p>
            </a>
        `).join('');
    } catch (e) { 
        console.error('Deep Dive Query Error:', e);
        grid.innerHTML = '<p class="text-zinc-400 text-center col-span-full">Unable to load study materials at this time.</p>'; 
    }
}