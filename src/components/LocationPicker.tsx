import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Navigation, Crosshair, Loader2, MousePointerClick, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MapView from "@/components/MapView";
import { getCurrentPosition, DEFAULT_CENTER, type GeoCoordinates } from "@/lib/geolocation";
import type { Location, LocationMethod } from "@/api/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MAP_ICON = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  value: Location;
  onChange: (loc: Location) => void;
  addressError?: string;
}

interface Tab {
  id: LocationMethod;
  label: string;
  icon: typeof Navigation;
}

const TABS: Tab[] = [
  { id: "gps", label: "GPS", icon: Crosshair },
  { id: "map", label: "خريطة", icon: MapPin },
  { id: "manual", label: "يدوي", icon: PenLine },
];

const METHOD_LABELS: Record<LocationMethod, string> = {
  gps: "GPS",
  map: "الخريطة",
  manual: "إدخال يدوي",
};

export default function LocationPicker({ value, onChange, addressError }: LocationPickerProps) {
  const [activeTab, setActiveTab] = useState<LocationMethod>(() => {
    if (value.method !== "manual") return value.method;
    if (value.latitude !== undefined) return "map";
    return "manual";
  });
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const hasCoords = value.latitude !== undefined && value.longitude !== undefined;

  // Leaflet interactive map
  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    try {
      const lat = value.latitude ?? DEFAULT_CENTER.lat;
      const lng = value.longitude ?? DEFAULT_CENTER.lng;
      const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([lat, lng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);

      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        placeMarker(map, lat, lng);
        onChange({
          ...value,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          method: "map",
        });
      });

      if (value.latitude !== undefined && value.longitude !== undefined) {
        placeMarker(map, value.latitude, value.longitude);
      }

      mapInstanceRef.current = map;
    } catch {
      setMapError(true);
    }
  }, []);

  const placeMarker = (map: L.Map, lat: number, lng: number) => {
    if (markerRef.current) map.removeLayer(markerRef.current);
    markerRef.current = L.marker([lat, lng], { icon: MAP_ICON, draggable: true })
      .addTo(map)
      .on("dragend", function () {
        const pos = this.getLatLng();
        onChange({
          ...value,
          latitude: Number(pos.lat.toFixed(6)),
          longitude: Number(pos.lng.toFixed(6)),
          method: "map",
        });
      });
  };

  useEffect(() => {
    if (activeTab === "map" && !mapInstanceRef.current) {
      initMap();
    }
    return () => {
      if (activeTab !== "map" && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [activeTab, initMap]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (
      mapInstanceRef.current &&
      value.latitude !== undefined &&
      value.longitude !== undefined
    ) {
      const existing = markerRef.current?.getLatLng();
      const moved =
        !existing ||
        Math.abs(existing.lat - value.latitude) > 0.000001 ||
        Math.abs(existing.lng - value.longitude) > 0.000001;
      if (moved && activeTab === "map") {
        placeMarker(mapInstanceRef.current, value.latitude, value.longitude);
        mapInstanceRef.current.setView([value.latitude, value.longitude], 15);
      }
    }
  }, [value.latitude, value.longitude, activeTab]);

  // GPS
  const handleDetectLocation = async () => {
    setDetecting(true);
    setGeoError(null);
    try {
      const pos = await getCurrentPosition();
      onChange({
        ...value,
        latitude: Number(pos.lat.toFixed(6)),
        longitude: Number(pos.lng.toFixed(6)),
        method: "gps",
      });
      setActiveTab("gps");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "تعذر الحصول على الموقع";
      setGeoError(msg);
    } finally {
      setDetecting(false);
    }
  };

  // Manual
  const handleAddressChange = (v: string) => {
    onChange({ ...value, address: v, method: value.method === "manual" ? "manual" : value.method });
  };
  const handleLatChange = (v: string) => {
    const num = v === "" ? undefined : Number(v);
    onChange({ ...value, latitude: num, method: "manual" });
  };
  const handleLngChange = (v: string) => {
    const num = v === "" ? undefined : Number(v);
    onChange({ ...value, longitude: num, method: "manual" });
  };

  const methodBadge = hasCoords && (
    <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
      <Navigation className="h-3 w-3" />
      تم التحديد عبر: {METHOD_LABELS[value.method]}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Method badge */}
      {methodBadge}

      {/* Tab switcher */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* GPS tab */}
      {activeTab === "gps" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            استخدم موقعك الحالي لتحديد مكان الوظيفة على الخريطة.
          </p>
          <Button
            type="button"
            variant="accent"
            className="w-full"
            onClick={handleDetectLocation}
            disabled={detecting}
          >
            {detecting ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Crosshair className="h-4 w-4 ml-2" />
            )}
            {detecting ? "جاري تحديد الموقع..." : "تحديد موقعي الحالي"}
          </Button>
          {geoError && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <span>⚠</span> {geoError}
            </p>
          )}
          {hasCoords && value.method === "gps" && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
              <div className="font-medium mb-1">📍 تم تحديد الموقع بنجاح</div>
              <div className="text-muted-foreground text-xs">
                {value.latitude!.toFixed(5)}, {value.longitude!.toFixed(5)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map tab */}
      {activeTab === "map" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            انقر على الخريطة لتحديد مكان الوظيفة، أو اسحب العلامة لتعديل الموقع.
          </p>
          {mapError ? (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground p-6 text-center">
              تعذّر تحميل الخريطة. تأكّد من اتصالك بالإنترنت.<br />
              استخدم طريقة الإدخال اليدوي كبديل.
            </div>
          ) : (
            <div ref={mapContainerRef} className="w-full rounded-lg overflow-hidden z-0" style={{ height: 280 }} />
          )}
          {hasCoords && value.method === "map" && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MousePointerClick className="h-3 w-3" />
              {value.latitude!.toFixed(5)}, {value.longitude!.toFixed(5)}
            </p>
          )}
        </div>
      )}

      {/* Manual tab */}
      {activeTab === "manual" && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="loc-address">العنوان التفصيلي *</Label>
            <Input
              id="loc-address"
              placeholder="الحي، الشارع، علامة مميزة"
              value={value.address}
              onChange={(e) => handleAddressChange(e.target.value)}
            />
            {addressError && <p className="text-destructive text-sm mt-1">{addressError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="loc-lat" className="text-xs">خط العرض (Latitude)</Label>
              <Input
                id="loc-lat"
                type="number"
                step="any"
                placeholder="30.0444"
                dir="ltr"
                value={value.latitude ?? ""}
                onChange={(e) => handleLatChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="loc-lng" className="text-xs">خط الطول (Longitude)</Label>
              <Input
                id="loc-lng"
                type="number"
                step="any"
                placeholder="31.2357"
                dir="ltr"
                value={value.longitude ?? ""}
                onChange={(e) => handleLngChange(e.target.value)}
              />
            </div>
          </div>
          {/* Live map preview — like Google Maps */}
          <div className="rounded-lg overflow-hidden border border-border">
            {hasCoords ? (
              <MapView
                markers={[{
                  id: "selected",
                  lat: value.latitude!,
                  lng: value.longitude!,
                  title: value.address || "الموقع المحدد",
                }]}
                center={{ lat: value.latitude!, lng: value.longitude!, timestamp: 0 } as GeoCoordinates}
                zoom={16}
                height={220}
              />
            ) : (
              <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
                <div>
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-primary/50" />
                  اكتب العنوان والإحداثيات هتظهر على الخريطة
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map preview for GPS tab */}
      {activeTab === "gps" && hasCoords && (
        <MapView
          markers={[{
            id: "selected",
            lat: value.latitude!,
            lng: value.longitude!,
            title: value.address || "الموقع المحدد",
          }]}
          center={{ lat: value.latitude!, lng: value.longitude!, timestamp: 0 } as GeoCoordinates}
          zoom={15}
          height={180}
        />
      )}
    </div>
  );
}
