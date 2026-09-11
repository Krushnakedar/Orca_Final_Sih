import React, { useState, useEffect } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import MarineMap from "../features/map/MarineMap";
import GeofenceMonitor from "../features/geofence/GeofenceMonitor";
import { mapService } from "../services/mapService";

export default function MapPage() {
  const [selectedSector, setSelectedSector] = useState("Mumbai Coast");
  const [layersData, setLayersData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLayers = async () => {
    setLoading(true);
    try {
      const res = await mapService.getLayers(selectedSector);
      if (res?.data) {
        setLayersData(res.data);
      }
    } catch (err) {
      console.error("Error fetching marine map layers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayers();
  }, [selectedSector]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Marine GIS & Geofencing Command Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-layer oceanographic cartography, Marine Protected Areas
            (MPAs), naval firing perimeters, and IMBL boundary monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <MapPin
              className="w-3.5 h-3.5 text-ocean-400 shrink-0"
              aria-hidden="true"
            />
            <label htmlFor="map-sector" className="text-slate-400">
              Sector:
            </label>
            <select
              id="map-sector"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-transparent font-semibold text-slate-100 focus:outline-none cursor-pointer"
            >
              <option
                value="Mumbai Coast"
                className="bg-slate-900 text-slate-100"
              >
                Arabian Sea / Mumbai Coast
              </option>
              <option
                value="Kochi Harbor"
                className="bg-slate-900 text-slate-100"
              >
                Arabian Sea / Kochi Harbor
              </option>
              <option
                value="Chennai Offshore"
                className="bg-slate-900 text-slate-100"
              >
                Bay of Bengal / Chennai Coast
              </option>
              <option
                value="Visakhapatnam"
                className="bg-slate-900 text-slate-100"
              >
                Bay of Bengal / Visakhapatnam
              </option>
              <option value="Porbandar" className="bg-slate-900 text-slate-100">
                Gujarat / Porbandar & Kutch
              </option>
            </select>
          </div>

          <button
            onClick={fetchLayers}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 transition"
            title="Reload GIS Layers"
            aria-label="Reload GIS layers"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-ocean-400 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Main Grid: GIS Map (8 Cols) + Geofencing Monitor (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950">
            <MarineMap
              layersData={layersData}
              selectedSector={selectedSector}
              onSelectSector={setSelectedSector}
              height="680px"
              compact={false}
            />
          </div>

          {/* Map Layer Legend Pill Bar */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400 inline-block" />
                <span>PFZ Pelagic Zones</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 rounded bg-emerald-800/80 border border-emerald-500 inline-block" />
                <span>Marine Protected Areas (MPAs)</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 rounded bg-rose-900/80 border border-rose-500 inline-block" />
                <span>Naval Restricted Zones</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span>Submerged Hazards</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-1 bg-red-500 border-dashed inline-block" />
                <span>IMBL Border (12 NM)</span>
              </span>
            </div>

            <span className="text-[10px] font-mono text-slate-500">
              WGS84 EPSG:4326 Projection
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <GeofenceMonitor />
        </div>
      </div>
    </div>
  );
}
