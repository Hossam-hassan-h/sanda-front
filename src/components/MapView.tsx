import { memo, useMemo, useState } from "react";
import { MapPin, Navigation, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { distanceKm, formatDistance, DEFAULT_CENTER, type GeoCoordinates } from "@/lib/geolocation";
import { cn } from "@/lib/utils";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  href?: string;
}

export interface MapViewProps {
  markers: MapMarker[];
  center?: GeoCoordinates;
  userLocation?: GeoCoordinates | null;
  zoom?: number;
  height?: number;
  className?: string;
  onMarkerClick?: (id: string) => void;
}

/**
 * Lightweight map view rendered as an OpenStreetMap iframe (no API key, no
 * external SDK). Shows markers as a sidebar list with a click-to-focus map
 * behavior. Falls back to a static skeleton if the user denies the iframe.
 */
export default memo(function MapView({
  markers,
  center,
  userLocation,
  zoom = 12,
  height = 360,
  className,
  onMarkerClick,
}: MapViewProps) {
  const mapCenter = useMemo<GeoCoordinates>(() => {
    if (center) return center;
    if (markers.length > 0) {
      const avgLat = markers.reduce((s, m) => s + m.lat, 0) / markers.length;
      const avgLng = markers.reduce((s, m) => s + m.lng, 0) / markers.length;
      return { lat: avgLat, lng: avgLng, timestamp: 0 };
    }
    return DEFAULT_CENTER;
  }, [center, markers]);

  const [activeId, setActiveId] = useState<string | null>(markers[0]?.id ?? null);
  const [iframeFailed, setIframeFailed] = useState(false);

  const bbox = useMemo(() => {
    if (markers.length === 0) {
      const pad = 0.02;
      return {
        minLat: mapCenter.lat - pad,
        minLng: mapCenter.lng - pad,
        maxLat: mapCenter.lat + pad,
        maxLng: mapCenter.lng + pad,
      };
    }
    const lats = markers.map((m) => m.lat);
    const lngs = markers.map((m) => m.lng);
    return {
      minLat: Math.min(...lats),
      minLng: Math.min(...lngs),
      maxLat: Math.max(...lats),
      maxLng: Math.max(...lngs),
    };
  }, [markers, mapCenter]);

  const embedUrl = useMemo(() => {
    const { minLat, minLng, maxLat, maxLng } = bbox;
    const deltaLat = Math.max(maxLat - minLat, 0.01);
    const deltaLng = Math.max(maxLng - minLng, 0.01);
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const span = `${deltaLat.toFixed(5)},${deltaLng.toFixed(5)}`;
    const pin = markers
      .slice(0, 20)
      .map((m) => `${m.lat},${m.lng}`)
      .join("|");
    const pinParam = pin ? `&pin=${pin}` : "";
    return `https://www.openstreetmap.org/export/embed.html?bbox=${span}&layer=mapnik&marker=${centerLat.toFixed(5)},${centerLng.toFixed(5)}${pinParam}`;
  }, [bbox, markers]);

  const activeMarker = markers.find((m) => m.id === activeId) ?? markers[0];

  const handleMarkerClick = (id: string) => {
    setActiveId(id);
    onMarkerClick?.(id);
  };

  return (
    <div className={cn("bg-card border border-border rounded-2xl overflow-hidden", className)}>
      <div className="grid md:grid-cols-[1fr_280px]">
        {/* Map iframe */}
        <div className="relative bg-muted" style={{ height }}>
          {iframeFailed ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground p-6 text-center">
              تعذّر تحميل الخريطة. تأكّد من اتصالك بالإنترنت.
            </div>
          ) : (
            <iframe
              title="Sanda jobs map"
              src={embedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              onError={() => setIframeFailed(true)}
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
          {!iframeFailed && (
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 text-xs flex items-center gap-2 shadow-sm">
              <Navigation className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{markers.length} موقع</span>
            </div>
          )}
        </div>

        {/* Sidebar list */}
        <div className="border-t md:border-t-0 md:border-r border-border max-h-[360px] overflow-y-auto">
          {markers.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              لا توجد مواقع لعرضها.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {markers.map((m) => {
                const dist = userLocation
                  ? distanceKm(userLocation, { lat: m.lat, lng: m.lng })
                  : null;
                const isActive = m.id === activeId;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => handleMarkerClick(m.id)}
                      className={cn(
                        "w-full text-right p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors",
                        isActive && "bg-primary/5"
                      )}
                    >
                      <div
                        className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                          isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{m.title}</div>
                        {m.subtitle && (
                          <div className="text-xs text-muted-foreground truncate">{m.subtitle}</div>
                        )}
                        {dist !== null && (
                          <div className="text-[11px] text-primary mt-1">{formatDistance(dist)}</div>
                        )}
                      </div>
                      {m.href && (
                        <a
                          href={m.href}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="فتح في الخريطة"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </a>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {activeMarker && (
        <div className="px-4 py-3 border-t border-border bg-muted/30 text-sm flex items-center justify-between gap-3">
          <div className="truncate">
            <span className="text-muted-foreground">المحدد: </span>
            <span className="font-semibold">{activeMarker.title}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const url = `https://www.openstreetmap.org/?mlat=${activeMarker.lat}&mlon=${activeMarker.lng}#map=${zoom}/${activeMarker.lat}/${activeMarker.lng}`;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            <Maximize2 className="h-3.5 w-3.5" /> فتح
          </Button>
        </div>
      )}

      {/* Loading skeleton helper for Suspense-like wrappers */}
      <noscript>
        <Skeleton className="w-full" style={{ height }} />
      </noscript>
    </div>
  );
});
