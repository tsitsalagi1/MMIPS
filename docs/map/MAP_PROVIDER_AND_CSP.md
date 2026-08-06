# Map provider and CSP plan

Status: foundation only. No map engine or provider is installed, selected, or enabled.

## Compatibility decision still open

| Candidate | Compatibility facts to verify | Decision status |
| --- | --- | --- |
| `maplibre-gl@6.0.0` | ESM-only, requires WebGL2, targets ES2022, and removes the former CSP-specific bundle. Browser-only loading and the worker strategy require testing. | Not selected |
| `maplibre-gl@5.24.0` | Final Version 5 release. Its browser bundle, worker behavior, and support baseline require testing against MMIPS targets. | Not selected |

The eventual dependency must be exactly pinned after compatibility testing with Next.js 16.3, React 19.2, TypeScript 6, Node 22.23.1, the production build, and supported browsers. It must load only in a browser component so server rendering never imports browser-only WebGL code. No package is installed during this correction pass.

## Provider boundary and failure behavior

A future reviewed style URL may use `NEXT_PUBLIC_MAP_STYLE_URL`; it is public configuration and must not contain a secret. No style/tile provider or external hostname is configured now. Before configuration, reviewers must document every style, tile, glyph, sprite, image, and telemetry hostname; retention and privacy terms; required attribution; token purpose and domain restrictions; and bundle impact. Tile/style requests disclose a visitor's IP address and request metadata to external hosts.

The permanent accessible list must remain functional when JavaScript, WebGL, MapLibre, style loading, tiles, or the provider fail. Visitor geolocation, locate-me controls, external geocoding, advertising, analytics, and map telemetry are prohibited.

## CSP plan

Do not add `connect-src *`, `img-src *`, `worker-src *`, `script-src unsafe-eval`, or broad provider wildcards. After a provider is selected, test and allowlist only its exact style/tile/glyph/sprite origins. Explicitly test MapLibre worker creation and any required `worker-src blob:`, image/blob handling, and `connect-src` requests. Version 6 has no former CSP-specific bundle, so its normal ESM worker path must be validated under the final policy. CSP enforcement remains an incomplete release gate.
