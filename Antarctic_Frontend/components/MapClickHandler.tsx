"use client";

import { useMapEvents } from "react-leaflet";

interface MapClickHandlerProps {
  active: boolean;
  /** true = next click sets start point, false = sets end point */
  settingStart: boolean;
  onPick: (lat: number, lon: number) => void;
}

/**
 * Invisible component that just listens for map clicks.
 * Must be rendered inside <MapContainer> (as a child, like the other layers).
 */
export default function MapClickHandler({ active, onPick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      if (!active) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}