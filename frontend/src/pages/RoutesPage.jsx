import React, { useState, useEffect } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import MarineMap from "../features/map/MarineMap";
import RoutePlanner from "../features/routes/RoutePlanner";
import { mapService } from "../services/mapService";

export default function RoutesPage() {
  const [selectedSector, setSelectedSector] = useState("Mumbai Coast");
  const [layersData, setLayersData] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLayers = async () => {
    setLoading(true);
    try {
      const res = await mapService.getLayers(selectedSector);
      if (res?.data) {
        setLayersData(res.data);
      }
    } catch (err) {
      console.error("Error fetching map layers for route planner:", err);
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
              Lower-Risk Vessel Route Planner
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Intelligent waypoint trajectory planning avoiding naval exercise
            perimeters, high swell shoals, and MPAs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-ocean-400 shrink-0" />
            <label htmlFor="routes-sector" className="text-slate-400">
              Sector:
            </label>
            <select
              id="routes-sector"
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
            title="Reload Map Layers"
            aria-label="Reload map layers"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-ocean-400 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Leaflet Marine Map (7 Cols) + Route Planner Drawer (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950">
            <MarineMap
              layersData={layersData}
              selectedSector={selectedSector}
              onSelectSector={setSelectedSector}
              height="680px"
              compact={false}
              routePlan={currentPlan}
            />
          </div>

          {/* Route Legend Indicator */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-1 bg-cyan-400 inline-block shadow-sm shadow-cyan-400" />
                <span>Lower-Risk Route Recommendation (Cyan Solid)</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-1 bg-rose-500 border-dashed inline-block" />
                <span>Direct Baseline Path (Rose Dashed)</span>
              </span>
            </div>

            <span className="text-[10px] font-mono text-slate-500">
              A* Obstacle Avoidance Trajectory
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <RoutePlanner
            onRouteGenerated={setCurrentPlan}
            currentPlan={currentPlan}
          />
        </div>
      </div>
    </div>
  );
}
