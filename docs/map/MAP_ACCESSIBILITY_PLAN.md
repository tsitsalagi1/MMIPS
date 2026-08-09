# Map accessibility plan

`/profiles` is the complete authoritative non-map interface for browsing and searching public profiles. `/map` is a map-first exploration interface and does not duplicate a paginated wall of profile cards below the map. The map page provides a clear link to Search Profiles so people who do not use, cannot use, or do not want the visual map still have a complete public-profile path.

The map has an accessible label, approximate-location instructions, functional 44-by-44-pixel keyboard zoom buttons, no focus stealing, and no forced scrolling. Marker selection updates a polite React live region outside the canvas using public-safe text fields. Category/status and approved location precision are conveyed in text, never color alone. Scroll zoom, rotation, and pitch are disabled to prevent page-scroll capture and disorientation.

A 5-digit U.S. ZIP search moves the map to a general area and loads only approved public map points nearby. The browser sends the ZIP to a same-origin MMIPS endpoint with a POST request and no-store caching. The server uses the existing U.S. Census TIGERweb ZCTA lookup helper, resolves the ZIP centroid, and returns a bounded public-safe collection of approved map points within about 100 miles. The ZIP search is not written into case data and must not be treated as an incident, home, shelter, recovery, witness, family, or investigative location.

The initial map page does not download the national public case collection. Until a ZIP is entered, the public map displays the basemap and an accessible instruction to enter a ZIP. After a ZIP lookup, local filters operate only on the nearby result collection and do not reset the ZIP camera position.

All automatic camera changes use zero duration. ZIP focus uses an instantaneous zero-duration camera move rather than an animated trip across the map. CSS continues to honor `prefers-reduced-motion`; there are no initial animations, pulses, or continuous animations. Generic inline fallbacks link people to Search Profiles when configuration, JavaScript/WebGL, initialization, style, provider, or context fails.

Static checks verify source contracts only. Manual browser keyboard, screen-reader, 200%/400% zoom and reflow, high-contrast, reduced-motion, WebGL failure, ZIP-search error recovery, and WCAG 2.2 AA testing remain incomplete release gates. No conformance claim is made.
