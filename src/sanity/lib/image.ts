import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";

import { dataset, projectId } from "@/sanity/env";

const builder = createImageUrlBuilder({ projectId, dataset });

/** Image URL builder; respects the crop and hotspot set in the Studio */
export const urlFor = (source: SanityImageSource) => builder.image(source);
