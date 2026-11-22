# Deployment

The app is a standard Next.js 15 App Router build. Static pages are prerendered; only
`/api/contact` is dynamic.

## Vercel (recommended)

1. Import the repository, framework preset **Next.js**, Node **20.x or 22.x**.
2. Build command `npm run build`, output handled by the platform.
3. Set environment variables (Project → Settings → Environment Variables):

   | Key | Environments | Example |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | Production, Preview | `https://nexus.example.com` |
   | `RESEND_API_KEY` | Production | `re_...` (server only) |
   | `CONTACT_TO_EMAIL` | Production | `you@example.com` |
   | `CONTACT_FROM_EMAIL` | Production | `NEXUS Contact <contact@example.com>` |
   | `NEXT_PUBLIC_CONTACT_EMAIL` | All | `you@example.com` |
   | `NEXT_PUBLIC_GITHUB_URL` | All | `https://github.com/<user>` |
   | `NEXT_PUBLIC_LINKEDIN_URL` | All | `https://www.linkedin.com/in/<user>` |

4. Deploy, then attach the custom domain.

`NEXT_PUBLIC_SITE_URL` affects canonical URLs, Open Graph URLs, `sitemap.xml` and
`robots.txt`; set it before the first production build.

## Self-hosted Node

```bash
npm ci
npm run build
NODE_ENV=production PORT=3000 npm start
```

Behind Nginx (mirrors the infrastructure described in mission 003):

```nginx
server {
  listen 443 ssl http2;
  server_name nexus.example.com;

  ssl_certificate     /etc/letsencrypt/live/nexus.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/nexus.example.com/privkey.pem;

  # Immutable, content-hashed Next assets
  location /_next/static/ {
    proxy_pass http://127.0.0.1:3000;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
server {
  listen 80;
  server_name nexus.example.com;
  return 301 https://$host$request_uri;
}
```

Certificates: `certbot --nginx -d nexus.example.com` and renew via the packaged timer.
DNS: an `A`/`AAAA` record for the apex and a `CNAME` for `www`, both pointing at the host.

## Docker

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

`NEXT_PUBLIC_*` values are inlined at build time, so pass them as build args, not only at
runtime.

## Headers and caching

`next.config.ts` sets:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cache-Control: public, max-age=31536000, immutable` for `/fonts/*`

Frame protection is intentionally absent so the facility can be embedded. If your
deployment needs clickjacking protection, add a `Content-Security-Policy` with
`frame-ancestors` at the edge, and keep the conventional routes reachable for crawlers.

## Post-deploy checks

```bash
curl -sI https://<domain>/ | head            # headers, 200
curl -s  https://<domain>/robots.txt
curl -s  https://<domain>/sitemap.xml | head
curl -s  https://<domain>/api/contact        # {"ok":true,"configured":true}
curl -sX POST https://<domain>/api/contact \
  -H 'content-type: application/json' \
  -d '{"name":"Test","email":"test@example.com","message":"Deployment verification message.","company":""}'
```

Expect `not_configured` until mail variables are set; that is the intended honest
behaviour, not a failure.

## Performance notes

- `next build` reports ~340 kB first-load JS for `/` (three.js, drei and postprocessing
  arrive with the dynamically imported `WorldCanvas`, not in the shared chunk).
- Quality auto-detection stores its decision in `localStorage` (`nexus-quality-set`).
  Delete that key to re-run detection, or use Settings → Quality.
- The PERFORMANCE profile caps device pixel ratio at 1, disables shadows, bloom and
  reflections, cuts particles and halves the room light budget; a touch control layer
  replaces pointer lock on mobile.
- Adaptive resolution is on by default: the pixel ratio moves down inside the profile's
  range when the frame rate dips below 50 FPS and climbs back when there is headroom.
- Verify the production build with `npm run verify` before deploying — it exercises the
  world, the interactions and every overlay without a browser.
