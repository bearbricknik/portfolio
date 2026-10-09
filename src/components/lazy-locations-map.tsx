"use client";

import dynamic from "next/dynamic";

/**
 * The map, loaded only in the browser and only on /locations: MapLibre is by
 * far the largest library on the site and draws on a canvas anyway, so it
 * stays out of the HTML and every other page's bundle. Its frame (fixed
 * height) is already in place, so nothing shifts when it arrives.
 */
export const LazyLocationsMap = dynamic(() => import("@/components/locations-map"), { ssr: false });
