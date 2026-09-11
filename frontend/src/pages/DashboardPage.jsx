import React, { useState, useEffect } from "react";
import {
  MapPin,
  AlertTriangle,
  Bot,
  Layers,
  ArrowUpRight,
  Maximize2,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardService } from "../services/dashboardService";
import { mapService } from "../services/mapService";
import { useAuth } from "../hooks/useAuth";
import MarineMap from "../features/map/MarineMap";
import RiskAuditViewer from "../features/risk/RiskAuditViewer";

export default function DashboardPage({ apiStatus }) {
  const { user } = useAuth();
  const [selectedSector, setSelectedSector] = useState(
    user?.preferredSector?.includes("Kochi") ? "Kochi Harbor" : "Mumbai Coast",
  );
  const [telemetry, setTelemetry] = useState(null);
  const [mapLayers, setMapLayers] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, mapRes] = await Promise.all([
        dashboardService.getSummary(selectedSector),
        mapService.getLayers(selectedSector),
      ]);
      if (dashRes?.data) setTelemetry(dashRes.data);
      if (mapRes?.data) setMapLayers(mapRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedSector]);

  return (
    <div className="space-y-6">
      {/* Top Bar with Sector Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Marine Operations Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-agent telemetry aggregation and situational awareness
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <MapPin
              className="w-3.5 h-3.5 text-ocean-400 shrink-0"
              aria-hidden="true"
            />
            <label htmlFor="dashboard-sector" className="text-slate-400">
              Sector:
            </label>
            <select
              id="dashboard-sector"
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
            </select>
          </div>

          <button
            onClick={fetchDashboardData}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 transition"
            title="Refresh Dashboard Telemetry"
            aria-label="Refresh dashboard telemetry"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-ocean-400 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Main Telemetry 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Risk Assessment Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Risk Assessment
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-black ${
                  telemetry?.riskAssessment?.riskLevel === "CRITICAL"
                    ? "text-red-400"
                    : telemetry?.riskAssessment?.riskLevel === "HIGH"
                      ? "text-rose-400"
                      : telemetry?.riskAssessment?.riskLevel === "MODERATE"
                        ? "text-amber-400"
                        : "text-emerald-400"
                }`}
              >
                {telemetry?.riskAssessment?.riskScore || 24}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
              <span
                className={`text-xs font-bold uppercase ml-1 ${
                  telemetry?.riskAssessment?.riskLevel === "CRITICAL"
                    ? "text-red-400"
                    : telemetry?.riskAssessment?.riskLevel === "HIGH"
                      ? "text-rose-400"
                      : telemetry?.riskAssessment?.riskLevel === "MODERATE"
                        ? "text-amber-400"
                        : "text-emerald-400"
                }`}
              >
                ({telemetry?.riskAssessment?.riskLevel || "LOW"})
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2">
              {telemetry?.riskAssessment?.primaryFactors?.join(" • ") ||
                "Calm sea swell • Moderate breeze"}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>
              Confidence: {telemetry?.riskAssessment?.confidenceScore || 94}%
            </span>
            <span>Deterministic Engine</span>
          </div>
        </div>

        {/* 2. Weather & Wind Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Weather & Wind
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                telemetry?.weather?.isFallback
                  ? "bg-amber-950 border-amber-800 text-amber-300"
                  : "bg-teal-950 border-teal-800 text-teal-300"
              }`}
            >
              {telemetry?.weather?.isFallback
                ? "Fallback Model"
                : "Live Open-Meteo"}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-100">
                {telemetry?.weather?.windSpeedKmh || 18.2}{" "}
                <span className="text-sm font-normal text-slate-400">km/h</span>
              </span>
              <span className="text-xs text-ocean-400 font-semibold">
                {telemetry?.weather?.windDirection || "WSW (245°)"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
              <span>
                Temp:{" "}
                <strong className="text-slate-200">
                  {telemetry?.weather?.temperatureC || 28.5}°C
                </strong>
              </span>
              <span>
                Vis:{" "}
                <strong className="text-slate-200">
                  {telemetry?.weather?.visibilityKm || 10} km
                </strong>
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>Cyclone: {telemetry?.weather?.cycloneAlert || "None"}</span>
            <span
              className="truncate max-w-[110px]"
              title={telemetry?.weather?.sourceOrigin}
            >
              {telemetry?.weather?.isFallback ? "Mock Model" : "Live Feed"}
            </span>
          </div>
        </div>

        {/* 3. Ocean & Waves Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ocean & Waves
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                telemetry?.ocean?.isFallback
                  ? "bg-amber-950 border-amber-800 text-amber-300"
                  : "bg-teal-950 border-teal-800 text-teal-300"
              }`}
            >
              {telemetry?.ocean?.isFallback ? "INCOIS Model" : "Live CMEMS"}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-tealAccent-400">
                {telemetry?.ocean?.significantWaveHeightM || 1.8}{" "}
                <span className="text-sm font-normal text-slate-400">m</span>
              </span>
              <span className="text-xs text-slate-400">
                Period: {telemetry?.ocean?.wavePeriodSec || 7.2}s
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
              <span>
                SST:{" "}
                <strong className="text-slate-200">
                  {telemetry?.ocean?.sstCelsius || 27.8}°C
                </strong>
              </span>
              <span>
                Chl-a:{" "}
                <strong className="text-slate-200">
                  {telemetry?.ocean?.chlorophyllMgM3 || 0.95} mg/m³
                </strong>
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>Tide: {telemetry?.ocean?.tideStatus || "Ebb Tide"}</span>
            <span>
              Current: {telemetry?.ocean?.currentSpeedMps || 0.42} m/s
            </span>
          </div>
        </div>

        {/* 4. PFZ Intelligence Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              PFZ Intelligence
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-semibold">
              Satellite Advisory
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-400">
                {telemetry?.pfz?.nearestZoneDistanceKm || 16.2}{" "}
                <span className="text-sm font-normal text-slate-400">km</span>
              </span>
              <span className="text-xs text-slate-400">
                Bearing: {telemetry?.pfz?.bearingDegrees || 265}°
              </span>
            </div>
            <p
              className="text-[11px] text-slate-300 mt-1 truncate"
              title={telemetry?.pfz?.targetSpecies?.join(", ")}
            >
              Species:{" "}
              <strong className="text-slate-200">
                {telemetry?.pfz?.targetSpecies?.join(", ") || "Mackerel, Tuna"}
              </strong>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>Thermal Front: Detected</span>
            <Link
              to="/pfz"
              className="text-ocean-400 hover:text-ocean-300 font-semibold"
            >
              View All &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Embedded Deterministic Risk Audit Viewer Card */}
      {telemetry?.riskAssessment && (
        <RiskAuditViewer riskAssessment={telemetry.riskAssessment} />
      )}

      {/* Active Alerts Banner */}
      {telemetry?.alerts && telemetry.alerts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/70 flex items-start gap-3">
          <AlertTriangle
            className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-200">
                {telemetry.alerts[0].title}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300">
                {telemetry.alerts[0].agency || "INCOIS Marine Advisory"}
              </span>
            </div>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              {telemetry.alerts[0].description}
            </p>
          </div>
        </div>
      )}

      {/* Central Interactive Grid: Live MarineMap + AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-ocean-400" aria-hidden="true" />
              <h2 className="font-bold text-slate-100 text-sm">
                Interactive Marine GIS Map
              </h2>
            </div>
            <Link
              to="/map"
              className="inline-flex items-center gap-1.5 text-xs text-ocean-400 hover:text-ocean-300 font-medium transition"
            >
              <span>Full Screen GIS Center</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </Link>
          </div>

          <MarineMap
            layersData={mapLayers}
            selectedSector={selectedSector}
            onSelectSector={setSelectedSector}
            height="460px"
            compact={true}
          />
        </div>

        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bot
                  className="w-5 h-5 text-tealAccent-400"
                  aria-hidden="true"
                />
                <h2 className="font-bold text-slate-100">
                  AI Marine Assistant
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-3.5">
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask the assistant about voyage safety, PFZ locations, weather,
                or routing:
              </p>

              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                  Example questions
                </span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between hover:border-slate-700 transition cursor-default">
                  <span>
                    💬 <em>"Is it safe to go fishing tomorrow morning?"</em>
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between hover:border-slate-700 transition cursor-default">
                  <span>
                    💬{" "}
                    <em>
                      "Where is the nearest potentially favourable fishing
                      zone?"
                    </em>
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between hover:border-slate-700 transition cursor-default">
                  <span>
                    💬 <em>"Show a lower-risk navigation route."</em>
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
            Deterministic Engine: AI orchestrates &bull; Data provides evidence
            &bull; Rules calculate risk &bull; AI explains.
          </div>
        </div>
      </div>
    </div>
  );
}
