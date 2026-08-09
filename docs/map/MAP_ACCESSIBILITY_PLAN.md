# Public profile map accessibility plan

`/profiles` is the single public discovery interface for browsing and mapping approved MMIPS public profiles. The page does not duplicate a paginated wall of profile cards below the map. The legacy `/map` URL permanently redirects to `/profiles` so there is no separate public map experience to maintain.

The national map has an accessible label, approximate-location instructions, functional keyboard zoom controls, no focus stealing, and no forced scrolling. Marker selection updates a polite React live region outside the canvas using public-safe text fields. Category/status and approved location precision are conveyed in text, never color alone. Scroll zoom, rotation, and pitch are disabled to prevent page-scroll capture and disorientation.

The page shell and search controls render before the national point collection finishes loading. The client then requests the approved public map projection and clusters the visible national result set. Search criteria narrow the map rather than rendering a separate card list. A selected marker exposes one public profile summary and a link to the full profile page.

A 5-digit U.S. ZIP search may focus the map on a general area. ZIP-distance filtering uses the existing Census TIGERweb ZCTA helper and a bounded public-map query. The ZIP search is not written into case data and must not be treated as an incident, home, shelter, recovery, witness, family, or investigative location.

All automatic camera changes use zero duration. Search results fit their approved public map points without animation, and ZIP focus uses an instantaneous camera move rather than an animated trip across the map. CSS continues to honor `prefers-reduced-motion`; there are no initial pulses or continuous animations.

The page includes context that MMIPS is not a complete statistical census and that cluster totals are counts of approved MMIPS public profiles rather than population-adjusted rates. Synthetic scale-test data remains explicitly labeled so testing clusters cannot be mistaken for real case prevalence.

Static checks verify source contracts only. Manual browser keyboard, screen-reader, 200%/400% zoom and reflow, high-contrast, reduced-motion, WebGL failure, search error recovery, and WCAG 2.2 AA testing remain release gates. No conformance claim is made.
