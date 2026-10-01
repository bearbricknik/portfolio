"use client";

import Image from "next/image";
import type { SanityImageSource } from "@sanity/image-url";

import { urlFor } from "@/sanity/lib/image";

type SanityImageProps = {
  image: SanityImageSource;
  alt: string;
  /** Low-quality placeholder from Sanity (asset metadata lqip), blurred while loading */
  lqip?: string;
  /**
   * Crop to this height/width ratio (e.g. 10/16) around the Studio's hotspot,
   * filling the parent (which needs a size). Without it the image keeps its
   * own proportions and needs `width` and `height`.
   */
  ratio?: number;
  width?: number;
  height?: number;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * An image from Sanity through next/image: Sanity's CDN scales (and crops)
 * it, one URL per width next/image asks for, in AVIF/WebP where supported.
 */
export function SanityImage({ image, alt, lqip, ratio, width, height, sizes, priority = false, className }: SanityImageProps) {
  const loader = ({ width: w }: { width: number }) => {
    const url = urlFor(image).width(w).auto("format");
    return (ratio ? url.height(Math.round(w * ratio)).fit("crop") : url).url();
  };

  return (
    <Image
      src={urlFor(image).width(640).url()}
      loader={loader}
      alt={alt}
      {...(ratio ? { fill: true } : { width, height })}
      sizes={sizes}
      priority={priority}
      placeholder={lqip ? "blur" : "empty"}
      blurDataURL={lqip}
      className={className}
    />
  );
}
