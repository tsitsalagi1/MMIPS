# MapLibre compatibility decision

MMIPS pins `maplibre-gl` **6.0.0** exactly in both the manifest and npm lockfile; no CDN or semver range is used. npm added MapLibre and its transitive packages to `package-lock.json`.

The ESM package is imported only by a browser-only Client Component. Next.js 16 compiles its worker and CSS successfully. Version 6 requires WebGL2, so the renderer performs a one-time capability check before construction and retains the authoritative list when it is unavailable. The production build passed in Codex on Node 22.22.2; the repository-pinned Node 22.23.1 GitHub job remains authoritative.

The observed production build bundles the MapLibre worker through Next rather than loading it from a CDN. Version 5 was not evaluated because Version 6 had no reproducible application or build incompatibility.
