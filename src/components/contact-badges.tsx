import type { ReactNode } from "react";
import { IconCalendar1, IconEmail1 } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";

import { ExternalBadge } from "@/components/inline-badge";

const EMAIL = "dominik.huber97@googlemail.com";
const CAL_URL = "https://cal.com/dominik-huber-curt5d/15-minuten";

/**
 * The badges of the contact paragraph ("Contact.text"), for `t.rich`. Shared,
 * so the paragraph reads and links the same wherever it streams (/, /locations).
 */
export const contactBadges = {
  email: (chunks: ReactNode) => (
    <ExternalBadge
      href={`mailto:${EMAIL}`}
      icon={IconEmail1}
      color="text-muted-foreground"
      cursorLabel={EMAIL}
      newTab={false}
    >
      {chunks}
    </ExternalBadge>
  ),
  cal: (chunks: ReactNode) => (
    <ExternalBadge href={CAL_URL} icon={IconCalendar1} color="text-muted-foreground" cursorLabel="cal.com ↗">
      {chunks}
    </ExternalBadge>
  ),
};
