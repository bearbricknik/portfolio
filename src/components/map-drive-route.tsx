"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import * as MapLibreGL from "maplibre-gl";
import { useReducedMotion } from "motion/react";

import { CarIcon } from "@/components/car-icon";
import { useMap } from "@/components/ui/map";

type Coordinates = [number, number][];

type MapDriveRouteProps = {
  /** The route as [longitude, latitude] pairs; pass a smooth line, the car follows it exactly */
  coordinates: Coordinates;
  /** Seconds for one way; the car then turns around and drives back */
  duration?: number;
  /** Seconds the car waits (and turns) at each end */
  pause?: number;
};

// Route color per map theme (the map styles are black/white, so is the route), as RGB
const LINE_RGB = { dark: "255, 255, 255", light: "10, 10, 10" } as const;

// Length of the glowing trail behind the car, as a fraction of the route
const TRAIL = 0.22;
// Share of each leg spent speeding up / slowing down; constant speed in between
const RAMP = 0.12;
// How fast the car turns around at the ends (ms)
const TURN_SMOOTHING_MS = 160;

/** Cumulative length along the route (equirectangular, fine for fractions) */
function measure(coordinates: Coordinates) {
  const cumulative = [0];
  for (let i = 1; i < coordinates.length; i++) {
    const [lng1, lat1] = coordinates[i - 1];
    const [lng2, lat2] = coordinates[i];
    const midLat = ((lat1 + lat2) / 2) * (Math.PI / 180);
    cumulative.push(cumulative[i - 1] + Math.hypot((lng2 - lng1) * Math.cos(midLat), lat2 - lat1));
  }
  return cumulative;
}

/** The point `fraction` (0–1) of the way along the route */
function pointAt(coordinates: Coordinates, cumulative: number[], fraction: number): [number, number] {
  const total = cumulative[cumulative.length - 1];
  const target = total * Math.min(1, Math.max(0, fraction));
  let i = 1;
  while (i < cumulative.length - 1 && cumulative[i] < target) i++;
  const segment = cumulative[i] - cumulative[i - 1];
  const ratio = segment === 0 ? 0 : (target - cumulative[i - 1]) / segment;
  const [lng1, lat1] = coordinates[i - 1];
  const [lng2, lat2] = coordinates[i];
  return [lng1 + (lng2 - lng1) * ratio, lat1 + (lat2 - lat1) * ratio];
}

/**
 * Progress 0–1 over time 0–1 at constant speed, with a gentle speed-up at the
 * start and slow-down at the end (trapezoidal velocity)
 */
function travel(t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const k = 2 * RAMP * (1 - RAMP);
  if (t < RAMP) return (t * t) / k;
  if (t > 1 - RAMP) return 1 - ((1 - t) * (1 - t)) / k;
  return (t - RAMP / 2) / (1 - RAMP);
}

/**
 * `line-gradient` for the trail: fades in towards the car (`head`), transparent
 * elsewhere. `direction` 1 = trail behind a car driving towards the end.
 */
function trailGradient(head: number, direction: 1 | -1, strength: number, rgb: string) {
  const alphaAt = (x: number) => {
    const behind = (head - x) * direction; // distance behind the car
    if (behind < 0 || behind > TRAIL) return 0;
    return strength * (1 - behind / TRAIL) ** 2;
  };
  // Sampled evenly plus exactly at the car, so the head stays crisp
  const stops = new Set<number>([head, Math.min(1, head + 1e-4), Math.max(0, head - 1e-4)]);
  for (let i = 0; i <= 48; i++) stops.add(i / 48);
  const expression: unknown[] = ["interpolate", ["linear"], ["line-progress"]];
  for (const x of [...stops].sort((a, b) => a - b)) {
    expression.push(x, `rgba(${rgb}, ${alphaAt(x).toFixed(3)})`);
  }
  return expression as MapLibreGL.ExpressionSpecification;
}

/**
 * A calm route line with a little car driving it back and forth, trailed by a
 * soft glow. Render it as a child of <Map>, before the markers. With reduced
 * motion only the line is shown.
 */
export function MapDriveRoute({ coordinates, duration = 12, pause = 1.4 }: MapDriveRouteProps) {
  const { map, isLoaded, resolvedTheme } = useMap();
  const reducedMotion = useReducedMotion() ?? false;
  const cumulative = useMemo(() => measure(coordinates), [coordinates]);

  // The car is a plain MapLibre marker; React renders the icon into its element
  const [carElement] = useState(() => (typeof document === "undefined" ? null : document.createElement("div")));

  const rgb = LINE_RGB[resolvedTheme];
  const sourceId = "drive-route";
  const baseLayerId = "drive-route-base";
  const trailLayerId = "drive-route-trail";

  // Line layers. Re-added after every style swap (theme change), since
  // setStyle drops them; isLoaded turns false → true around the swap.
  useEffect(() => {
    if (!map || !isLoaded) return;

    map.addSource(sourceId, {
      type: "geojson",
      // Needed for `line-progress` in the trail gradient
      lineMetrics: true,
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } },
    });
    map.addLayer({
      id: baseLayerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": `rgb(${rgb})`, "line-width": 2, "line-opacity": 0.22 },
    });
    map.addLayer({
      id: trailLayerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-width": 3, "line-gradient": trailGradient(0, 1, 0, rgb) },
    });

    return () => {
      // The style may already be gone (style swap or unmount)
      try {
        if (map.getLayer(trailLayerId)) map.removeLayer(trailLayerId);
        if (map.getLayer(baseLayerId)) map.removeLayer(baseLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // ignore
      }
    };
  }, [map, isLoaded, coordinates, rgb]);

  // Animation: car position and heading, and the trail following it
  useEffect(() => {
    if (!map || !isLoaded || !carElement || reducedMotion || coordinates.length < 2) return;

    // Subpixel positioning: otherwise MapLibre snaps the car to whole pixels,
    // which makes it judder at slow speeds
    const car = new MapLibreGL.Marker({ element: carElement, rotationAlignment: "viewport", subpixelPositioning: true })
      .setLngLat(coordinates[0])
      .addTo(map);

    const leg = (duration + pause) * 1000;
    const start = performance.now();
    let last = start;
    let heading: number | null = null;
    let frame = 0;

    // The car keeps one fixed heading per leg (the overall direction from end
    // to end) instead of following every bend, so it glides without wobbling
    const legHeading = (direction: 1 | -1) => {
      const a = map.project(coordinates[0]);
      const b = map.project(coordinates[coordinates.length - 1]);
      const bearing = (Math.atan2(b.x - a.x, a.y - b.y) * 180) / Math.PI;
      return direction === 1 ? bearing : bearing + 180;
    };

    const tick = (now: number) => {
      const elapsed = now - start;
      const outbound = Math.floor(elapsed / leg) % 2 === 0;
      const inLeg = (elapsed % leg) / 1000;
      const moving = inLeg < duration;
      const progress = travel(inLeg / duration);
      const fraction = outbound ? progress : 1 - progress;
      const direction: 1 | -1 = outbound ? 1 : -1;

      car.setLngLat(pointAt(coordinates, cumulative, fraction));

      // While waiting at an end, turn towards the way back
      const target = legHeading(moving ? direction : (-direction as 1 | -1));
      if (heading === null) {
        heading = target;
      } else {
        const delta = ((target - heading + 540) % 360) - 180;
        heading += delta * (1 - Math.exp(-(now - last) / TURN_SMOOTHING_MS));
      }
      car.setRotation(heading);
      last = now;

      // Trail fades out while the car waits
      const strength = moving ? 0.9 : 0.9 * Math.max(0, 1 - (inLeg - duration) / Math.min(0.6, pause));
      if (map.getLayer(trailLayerId)) {
        map.setPaintProperty(trailLayerId, "line-gradient", trailGradient(fraction, direction, strength, rgb));
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      car.remove();
    };
  }, [map, isLoaded, carElement, reducedMotion, coordinates, cumulative, duration, pause, rgb]);

  return carElement && !reducedMotion ? createPortal(<CarIcon />, carElement) : null;
}
