# Map accessibility plan

The filterable public list is permanent, complete, and authoritative. The same filtered collection feeds list and map. Each feature has a corresponding list article and usable profile link; each valid visible list point becomes a feature when the renderer is available. The map cannot block filtering, list navigation, or profiles.

The optional map has an accessible label, approximate-location instructions, a skip link to the list, functional 44-by-44-pixel keyboard zoom buttons, no focus stealing, and no forced scrolling. Selection updates a polite React live region outside the canvas using text fields also available in the list. Category/status and precision are conveyed in text, never color alone. Scroll zoom, rotation, and pitch are disabled to prevent page-scroll capture and disorientation.

Camera changes use zero duration. CSS honors `prefers-reduced-motion`; there are no initial animations, fly-to transitions, pulses, or continuous animations. Generic inline fallbacks preserve the list when configuration, JavaScript/WebGL2, initialization, style, provider, or context fails.

Static checks verify source contracts only. Manual browser keyboard, screen-reader, 200%/400% zoom and reflow, high-contrast, reduced-motion, WebGL2 failure, and WCAG 2.2 AA testing remain incomplete release gates. No conformance claim is made.
