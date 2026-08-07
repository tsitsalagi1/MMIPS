# MapLibre compatibility decision

MMIPS exactly pins `maplibre-gl` **6.0.0** in `package.json` and `package-lock.json`. Version 6's ESM exports are imported only by a dynamically loaded Client Component; the Next.js server page and public database loader do not import MapLibre. MapLibre 6 requires WebGL2, so the renderer performs a capability check before construction and leaves the complete accessible list usable when WebGL2 is unavailable or lost.

`npm install --save-exact maplibre-gl@6.0.0` added the engine and its transitive packages to the lockfile. `npm ls maplibre-gl` resolved exactly 6.0.0. The production Next.js build passed in the Codex environment with Node 22.22.2, although this environment is one patch below the unchanged project minimum 22.23.1. Version 6 ESM compiled successfully with Next.js 16.3, React 19.2, and TypeScript 6, so Version 5 was not evaluated or needed.

The observed production build emitted the MapLibre client bundle without server-side `window`/`document` evaluation. Browser WebGL2, worker creation under the final CSP, provider behavior, and supported-browser compatibility remain release gates; source/static tests are not browser evidence.
