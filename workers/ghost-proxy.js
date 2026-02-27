/* ghost-proxy — Cloudflare Worker
 * Proxies requests to the Ghost Content API, adding CORS headers
 * so the static CF Pages site can fetch content without browser blocks.
 *
 * Deploy to: Cloudflare Workers dashboard → Create Worker → paste this code
 * Worker URL will be: https://ghost-proxy.<your-subdomain>.workers.dev
 */

const GHOST_ORIGIN = 'https://cms.tlrhd.com';

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
        const ghostUrl = `${GHOST_ORIGIN}${url.pathname}${url.search}`;

        try {
            const response = await fetch(ghostUrl, {
                headers: { 'Accept': 'application/json' }
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
