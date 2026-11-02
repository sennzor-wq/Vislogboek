# Vislogboek security and deployment checklist

## Application security model

Vislogboek is currently a client-side, offline-first PWA. Personal sessions, catches, locations, photos and settings are stored in the browser's IndexedDB database. The current codebase does not implement user accounts, a central user database or an application API backend.

This reduces the server-side attack surface, but it does not encrypt local data. Anyone with access to an unlocked device/browser profile, or code executing under the app's origin, may be able to read or change that browser's IndexedDB data. Users should protect their device and keep backups in a private location.

Weather requests are sent to Open-Meteo. Requests include the selected fishing-location coordinates. This is an intentional third-party disclosure and should be described in the privacy notice.

## Repository and build hygiene

- Never store personal backups, source archives, internal blueprints or credentials under `public/`; Vite copies public assets into the production output.
- Keep test fixtures and internal documentation outside `public/`.
- Keep `.env*` files out of Git except the documented placeholder `.env.example`.
- Never put a private API key in client-side code or a Vite `VITE_*` environment variable. Anything bundled into a browser application is public to its users.
- Review dependency advisories and update the lockfile as part of release preparation.
- Do not expose the Vite development server to the public internet. Build and serve the production output instead.

## Required production hosting headers

Configure these as HTTP response headers at the actual hosting provider. A meta tag in `index.html` is not a substitute for HSTS, `frame-ancestors`, or other response headers.

Recommended baseline (adjust only after testing PWA/offline behavior and the actual hosting setup):

- `Strict-Transport-Security: max-age=31536000` (add `includeSubDomains` only if every subdomain is HTTPS-only).
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `X-Frame-Options: DENY`.
- `Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://api.open-meteo.com https://archive-api.open-meteo.com; worker-src 'self' blob:; upgrade-insecure-requests`.
- `Permissions-Policy: geolocation=(self), camera=(self), microphone=()`.

The CSP must be verified against the production build, installed PWA, offline mode, photo previews and location permission flow before enforcement. Do not weaken `script-src` with `unsafe-inline` or `unsafe-eval` to silence a deployment error; investigate the actual blocked resource.

## Release gate

Before public release:

1. Run the full CI quality gate and the backup-import security regression tests.
2. Run the CI dependency audit (`bun audit`) against the committed lockfile, including transitive dependencies.
3. Check the actual deployed HTTP headers and TLS configuration.
4. Verify that no private backup, source archive, internal document, environment file or source map is served publicly.
5. Test malformed and oversized backup imports, including merge and full-restore flows.
6. Test the built PWA for XSS, unsafe URL handling, service-worker cache behavior and cross-origin data disclosure.
7. Publish a privacy notice that explains local storage, local backups, GPS permissions and Open-Meteo requests.

A source review and CI run do not constitute a penetration test or guarantee that the deployed hosting configuration is secure.
