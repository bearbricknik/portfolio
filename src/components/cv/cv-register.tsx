import type { ReactNode } from "react";

import { PhotoPeekProvider } from "@/components/photo-peek";

/**
 * The CV as a register: one `CvYear` after the other, newest first, with
 * `CvEntry`s inside. Hovered entries with a photo show it at the cursor.
 */
export function CvRegister({ children }: { children: ReactNode }) {
  return (
    <PhotoPeekProvider>
      <div className="flex flex-col">{children}</div>
    </PhotoPeekProvider>
  );
}
