import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { CircleMarker, useMap } from 'react-leaflet';
import { Info } from 'lucide-react';

/**
 * Native-looking Leaflet control ("leaflet-bar") placed top-left, directly under the zoom buttons.
 * Toggles "Inspect location" mode. Must be rendered inside a <MapContainer>.
 */
export function InspectControl({ active, onToggle }) {
  const map = useMap();
  const [container, setContainer] = useState(null);

  useEffect(() => {
    const control = L.control({ position: 'topleft' });
    control.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      // Clicks/scrolls on the control must not reach the map (would pan/select a point).
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      setContainer(div);
      return div;
    };
    control.addTo(map);
    return () => {
      control.remove();
      setContainer(null);
    };
  }, [map]);

  if (!container) return null;
  return createPortal(
    <button
      type="button"
      onClick={onToggle}
      aria-label="Inspect map location"
      aria-pressed={active}
      title="Inspect location"
      className={`flex h-[30px] w-[30px] items-center justify-center rounded-[2px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan-700 ${
        active ? 'bg-cyan-600 text-white ring-2 ring-inset ring-cyan-200' : 'bg-white text-slate-700 hover:bg-slate-100'
      }`}
    >
      <Info className="h-4 w-4" aria-hidden="true" />
    </button>,
    container
  );
}

/**
 * Small marker for the point whose details are shown in the map's top-right panel.
 * A single instance is driven by `point`, so it moves rather than duplicating.
 * Non-interactive so it never swallows clicks meant for re-selecting a point.
 */
export function SelectedLocationMarker({ point }) {
  if (!point) return null;
  return (
    <CircleMarker
      center={[point.lat, point.lon]}
      radius={6}
      interactive={false}
      pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#0e7490', fillOpacity: 1 }}
    />
  );
}
