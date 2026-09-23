import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { trackMatomoPageView } from "@/lib/matomo";

export default function MatomoTracker() {
  const href = useRouterState({ select: (state) => state.location.href });
  const lastTrackedUrl = useRef<string | undefined>(undefined);

  useEffect(() => {
    const trackCurrentRoute = () => {
      const routeUrl = new URL(href, window.location.origin);
      // Payment providers append identifiers to return URLs. Analytics only
      // needs the route, never payment-related query strings or fragments.
      const absoluteUrl = `${routeUrl.origin}${routeUrl.pathname}`;
      if (lastTrackedUrl.current === absoluteUrl) return;

      lastTrackedUrl.current = absoluteUrl;
      void trackMatomoPageView(absoluteUrl, document.title);
    };

    trackCurrentRoute();
  }, [href]);

  return null;
}
