# Map V1 architecture

The server supplies only moderated public map points. A Client Component dynamically loads MapLibre 6.0.0 with SSR disabled, validates provider configuration and WebGL2, and projects the points through the strict public GeoJSON boundary. Filters must supply the same array to the renderer and complete list. The map uses a GeoJSON source and restrained circle layer, conservative camera limits, no location services, no geocoder, no routing, and no tracking.
