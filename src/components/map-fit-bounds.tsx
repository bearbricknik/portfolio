"use client";

import { useEffect } from "react";
import type { LngLatBoundsLike, PaddingOptions } from "maplibre-gl";

import { useMap } from "@/components/ui/map";

type MapFitBoundsProps = {
  /** The area that always has to be visible, e.g. two places */
  bounds: LngLatBoundsLike;
  padding?: number | PaddingOptions;
};

/**
 * Keeps `bounds` in view: fits them once the map has loaded and again whenever
 * the map changes size (rotating the phone, resizing the window), so nobody
 * has to zoom to see everything. Render it as a child of <Map>.
 */
export function MapFitBounds({ bounds, padding }: MapFitBoundsProps) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    const fit = () => map.fitBounds(bounds, { padding, animate: false });
    fit();
    map.on("resize", fit);
    return () => {
      map.off("resize", fit);
    };
    // Bounds and padding are static per page; objects would re-fit every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded]);

  return null;
}
