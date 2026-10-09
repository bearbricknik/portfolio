"use client";

import { MapAttributionCollapsed } from "@/components/map-attribution-collapsed";
import { MapDriveRoute } from "@/components/map-drive-route";
import { MapFitBounds } from "@/components/map-fit-bounds";
import { Map, MapControls, MapMarker, MarkerContent, MarkerLabel } from "@/components/ui/map";
import { DRIVE_ROUTE } from "@/lib/drive-route";

// [longitude, latitude]
const COLOGNE: [number, number] = [6.9583, 50.9413];
// Nersingen (Hubertusweg 36); place-level precision is enough at this zoom
const NERSINGEN: [number, number] = [10.1206, 48.4267];
// The road route, extended to the exact marker positions
const ROUTE: [number, number][] = [COLOGNE, ...DRIVE_ROUTE, NERSINGEN];
// Both places always in view, with some room around them; more at the bottom
// (labels sit below the dots, the attribution bottom right) and on the right
// (zoom controls)
const BOUNDS: [[number, number], [number, number]] = [COLOGNE, NERSINGEN];
const BOUNDS_PADDING = { top: 40, right: 100, bottom: 72, left: 64 };

function Marker({ position, label }: { position: [number, number]; label: string }) {
  return (
    <MapMarker longitude={position[0]} latitude={position[1]}>
      <MarkerContent>
        <div className="size-3 rounded-full bg-foreground ring-4 ring-foreground/15" />
        {/* Positioned relative to the dot, so it has to live inside MarkerContent */}
        <MarkerLabel position="bottom" className="mt-1.5 text-xs">
          {label}
        </MarkerLabel>
      </MarkerContent>
    </MapMarker>
  );
}

/** The drive from Cologne to Nersingen on a map (MapLibre, browser only, see LazyLocationsMap) */
export default function LocationsMap({ labels }: { labels: { cologne: string; nersingen: string } }) {
  return (
    <Map
      // Initial view; MapFitBounds keeps it right when the size changes
      bounds={BOUNDS}
      fitBoundsOptions={{ padding: BOUNDS_PADDING }}
      // The wheel scrolls the page, not the map; zoom via the controls
      scrollZoom={false}
    >
      <MapFitBounds bounds={BOUNDS} padding={BOUNDS_PADDING} />
      <MapControls />
      <MapAttributionCollapsed />
      {/* Before the markers, so the city dots sit on top of the line */}
      <MapDriveRoute coordinates={ROUTE} />
      <Marker position={COLOGNE} label={labels.cologne} />
      <Marker position={NERSINGEN} label={labels.nersingen} />
    </Map>
  );
}
