"use client";

import type { GeoCoordinates } from "@kapas/domain";
import { t } from "@kapas/localization";
import { ExternalLink } from "lucide-react";

import {
  formatCoordinates,
  googleMapsSearchUrl,
  openStreetMapEmbedUrl,
} from "@/lib/map-links";
import { useLocaleStore } from "@/stores/locale-store";

export function ComplaintLocationMap({
  coordinates,
  accuracyMeters,
}: {
  coordinates: GeoCoordinates;
  accuracyMeters?: number;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const mapsUrl = googleMapsSearchUrl(coordinates);
  const embedUrl = openStreetMapEmbedUrl(coordinates);
  const title = t(locale, "portal.case.deviceLocationMap");

  return (
    <div className="mt-3 space-y-2">
      <div className="overflow-hidden rounded-control border border-border bg-page">
        <iframe
          title={title}
          src={embedUrl}
          className="h-44 w-full border-0 sm:h-52"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted" dir="ltr">
          {formatCoordinates(coordinates)}
          {typeof accuracyMeters === "number"
            ? ` · ±${Math.round(accuracyMeters)} m`
            : null}
        </p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-control border border-border bg-surface px-3 text-xs font-medium text-ink hover:bg-page"
        >
          {t(locale, "portal.case.openInGoogleMaps")}
          <ExternalLink aria-hidden size={14} />
        </a>
      </div>
    </div>
  );
}
