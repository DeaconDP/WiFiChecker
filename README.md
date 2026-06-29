# WiFiChecker

Cross-platform **Progressive Web App** for network health checks — connectivity status, browser-reported connection info, and latency/reachability tests. Installable on phone, tablet, and desktop.

## Features (v0.1)

- Online/offline status with live updates
- Connection type and Network Information API metrics (where the browser exposes them)
- Latency suite against Google, Cloudflare, and the app origin
- Installable PWA shell (manifest + service worker)
- Mobile-first responsive UI

## Browser limits

Web apps cannot access Wi‑Fi SSID, signal strength, or scan nearby networks. WiFiChecker focuses on what browsers *can* measure: connectivity, estimated link quality, and round-trip latency.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL. For phone testing, deploy to Vercel/Netlify or tunnel the dev server (e.g. Cloudflare Tunnel, ngrok) and open the public URL on your device. Use **Add to Home Screen** / **Install app** to install the PWA.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |

## Deploy

### GitHub Pages

This repo includes a [GitHub Actions workflow](.github/workflows/deploy.yml) that builds and publishes to Pages on every push to `main`.

1. In the repo on GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Merge to `main` (or run the workflow manually from the **Actions** tab).

The app will be available at **https://deacondp.github.io/WiFiChecker/**.

Local production preview with the same base path:

```bash
VITE_BASE_PATH=/WiFiChecker/ npm run build
npm run preview
```

### Other static hosts

Any static host works. Example with Vercel:

```bash
npm run build
# deploy dist/ or connect the repo to Vercel with build command `npm run build` and output `dist`
```

## License

MIT
