import type { ReactNode } from 'react';

// Next remounts the template on page navigation, including browser back/forward.
// Keep navigation native: no click interception, timers or blocking overlays.
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
