# SkyChain mobile pilot experience

Mobile PWA with a Cloudflare-compatible Worker. Source assets live in `public/`. Run `npm run build` then `npm test`. `dist/` is generated output.

The interactive map uses Leaflet 1.9.4 with OpenStreetMap raster tiles. No map API key is required. Visible tiles are requested through the same-origin `/api/tiles/{z}/{x}/{y}.png` endpoint, identified as SkyChain upstream and cached for seven days; the browser never prefetches tiles. The Worker exposes runtime configuration for the upstream, fallback and search services. If the proxied source fails repeatedly, the map automatically switches to the fallback source. Deployments with significant traffic should configure a suitable OSM-derived provider or self-hosted service.

Place search is initiated only when the user submits a query, limited to four Vietnamese results, rate-limited to one request per second, and cached in memory for the session. The map always shows OpenStreetMap attribution. The app does not prefetch or cache map tiles for offline use.

All orders, medical-unit identity, UAV telemetry, cold-chain data, dispatch and OTP/POD are device-local simulations. Data from the previous v4 demo migrates on first visit. GPS is requested on tap. Selecting GPS as a destination persists those coordinates with the local order. Demo station coordinates are illustrative and not verified medical facility locations. Aerial polylines are not approved flight routes; road navigation opens an external OpenStreetMap directions page.

The PWA caches only the same-origin app shell, never OpenStreetMap tiles or `/api/` responses. Offline mode shows locally stored data and pauses simulation; an online connection is required for the map. Splash/login/role selection remain mandatory at every launch. Remember account stores an identifier only, not a password or authenticated session.

Validation covers core state, completion, cancellation, alert pause, expired/invalid OTP, POD, route mode, OpenStreetMap runtime configuration and static assets. No actual browser/GPS/external-service availability verification is implied by the unit tests.
