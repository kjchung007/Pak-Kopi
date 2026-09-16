"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

/** Wheel easing on the public website; touch retains the browser's own inertia. */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const scroll = new Lenis({
      autoRaf: true,
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
      anchors: true,
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
      allowNestedScroll: true,
    });

    // Recreate on navigation so momentum cannot carry into the next page.
    return () => scroll.destroy();
  }, [pathname]);

  return null;
}
