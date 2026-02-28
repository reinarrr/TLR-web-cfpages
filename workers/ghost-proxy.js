/* ghost-proxy — Cloudflare Worker
 * Proxies requests to the Ghost Content API, adding CORS headers
 * so the static CF Pages site can fetch content without browser blocks.
 *
 * Deploy to: Cloudflare Workers dashboard → Create Worker → paste this code
 * Worker URL will be: https://ghost-proxy.<your-subdomain>.workers.dev
 */

const GHOST_ORIGIN = 'https://cms.tlrhd.com';

// Shared secret — must match the value in your CF WAF Skip rule on cms.tlrhd.com
// CF Dashboard → cms.tlrhd.com → Security → WAF → Create rule:
//   IF http.request.headers["x-proxy-secret"] eq "tlr-ghost-2026"
//   THEN Skip → All remaining custom rules + Bot Fight Mode
const PROXY_SECRET = 'tlr-ghost-2026';

export default {
    async fetch(request) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Max-Age': '86400',
                }
            });
        }

        if (request.method !== 'GET') {
            return new Response('Method not allowed', { status: 405 });
        }

        const url = new URL(request.url);

        // Only allow Content API paths — block anything else (admin, frontend, etc.)
        if (!url.pathname.startsWith('/ghost/api/content/')) {
            return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        const ghostUrl = `${GHOST_ORIGIN}${url.pathname}${url.search}`;

        try {
            const response = await fetch(ghostUrl, {
                headers: {
                    'Accept': 'application/json',
                    'X-Proxy-Secret': PROXY_SECRET,
                }
            });

            const body = await response.text();

            return new Response(body, {
                status: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=60',
                }
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Ghost proxy error', detail: e.message }), {
                status: 502,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            });
        }
    }
};
