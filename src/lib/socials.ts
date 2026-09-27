import type { ComponentType } from "react";
import {
  IconEmail1,
  IconFileText,
  IconGithub,
  IconLinkedin,
  IconMapPin,
  IconX,
} from "@central-icons-react/round-outlined-radius-3-stroke-1.5";

export type Social = {
  /** Key in the `Socials` messages, used as accessible label and cursor text */
  key: "x" | "github" | "linkedin" | "email" | "cv" | "locations";
  href: string;
  icon: ComponentType<{ className?: string }>;
};

/** External (`https:`/`mailto:`) or internal (`/…`) links, in display order */
export const SOCIALS: Social[] = [
  { key: "x", href: "https://x.com/bearbricknik", icon: IconX },
  { key: "github", href: "https://github.com/bearbricknik", icon: IconGithub },
  { key: "linkedin", href: "https://www.linkedin.com/in/kaufland/", icon: IconLinkedin },
  { key: "email", href: "mailto:dominik.huber97@googlemail.com", icon: IconEmail1 },
  { key: "cv", href: "/cv", icon: IconFileText },
  { key: "locations", href: "/locations", icon: IconMapPin },
];
