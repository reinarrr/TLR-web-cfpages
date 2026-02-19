/* live.js - The Living Room Live Logic */

/**
 * 1. YouTube Live/Latest Player
 * Fetches the latest video from the playlist and embeds it.
 */
async function fetchLiveVideo() {
    const container = document.getElementById('live-player-container');
    if (!container) return;

    try {
        const response = await fetch('https://youtube-proxy.reinar-6fd.workers.dev/');
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const videoId = data.items[0].contentDetails.videoId; 
            container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allowfullscreen></iframe>`;
        }
    } catch (e) { 
        console.error('YouTube Fetch Error:', e);
        container.innerHTML = `<p class="text-zinc-400 p-20 text-center">Unable to load stream. Please check our YouTube channel.</p>`;
    }
}

/**
 * 2. Service Countdown Logic
 * Calculates 01:00 UTC Sunday and updates the UI every second.
 */
function updateNextServiceTime() {
    const timeElement = document.getElementById('next-service-time');
    const zoneElement = document.getElementById('local-timezone');
    if (!timeElement) return;

    function getTargetTime() {
        const now = new Date();
        // Service is 01:00 UTC Sunday
        let nextService = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 1, 0, 0));
        let dayShift = (7 - now.getUTCDay()) % 7;
        nextService.setUTCDate(now.getUTCDate() + dayShift);
        
        if (now.getUTCDay() === 0 && now.getUTCHours() >= 1) {
            nextService.setUTCDate(nextService.getUTCDate() + 7);
        }
        return nextService;
    }

    const nextService = getTargetTime();

    function refreshDisplay() {
        const now = new Date();
        const diff = nextService - now;
        const eightHours = 8 * 60 * 60 * 1000;
        
        const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
        const dateOptions = { weekday: 'long', month: 'long', day: 'numeric', ...timeOptions };
        const localTimeStr = nextService.toLocaleString([], timeOptions);
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ');

        // State: Live Now (2-hour window)
        if (diff <= 0 && diff > -(2 * 60 * 60 * 1000)) {
            timeElement.innerHTML = `<span class="text-teal animate-pulse">● LIVE NOW</span>`;
            zoneElement.innerHTML = `Started at ${localTimeStr} (${userTimeZone})`;
            return;
        }

        // State: Countdown (Within 8 hours)
        if (diff > 0 && diff < eightHours) {
            const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
            const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
            timeElement.innerHTML = `Live in ${h}:${m}:${s}`;
            zoneElement.innerHTML = `Starts at ${localTimeStr} • ${userTimeZone}`; 
        } 
        // State: Standard View
        else {
            timeElement.innerHTML = nextService.toLocaleString([], dateOptions);
            zoneElement.innerHTML = `Converted to your time (${userTimeZone})`;
        }
    }

    refreshDisplay();
    setInterval(refreshDisplay, 1000);
}

// Initialize logic
fetchLiveVideo();
updateNextServiceTime();