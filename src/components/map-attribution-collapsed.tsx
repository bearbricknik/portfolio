"use client";

import { useEffect } from "react";

import { useMap } from "@/components/ui/map";

/**
 * Starts the map's compact attribution collapsed (just the "i" button).
 * MapLibre opens it on load and has no option for that; this does what its own
 * minimize does. The attribution stays one click away, as the licenses require.
 * Render it as a child of <Map>.
 */
export function MapAttributionCollapsed() {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    const collapse = () =>
      map
        .getContainer()
        .querySelector(".maplibregl-ctrl-attrib.maplibregl-compact-show")
        ?.classList.remove("maplibregl-compact-show");
    collapse();
    // MapLibre may re-open it once the first tiles are in
    map.once("idle", collapse);
    return () => {
      map.off("idle", collapse);
    };
  }, [map, isLoaded]);

  return null;
}
