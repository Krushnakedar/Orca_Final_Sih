import React, { useState, useEffect } from 'react';
import {
  Database,
  Radio,
  CloudSun,
  Waves,
  Compass,
  BellRing,
  MapPin,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight
} from 'lucide-react';
import { providerService } from '../services/providerService';
import LoadingSpinner from '../components/LoadingSpinner';

const SECTORS = [
  { name: 'Mumbai Coast', lat: 18.9220, lon: 72.8347, state: 'Maharashtra' },
  { name: 'Kochi Harbor', lat: 9.9312, lon: 76.2673, state: 'Kerala' },
  { name: 'Chennai Offshore', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
  { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185, state: 'Andhra Pradesh' },
];

export default function DataSourcesPage() {
  const [sourcesInfo, setSourcesInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  const [activeQueryDomain, setActiveQueryDomain] = useState('weather');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  const loadSources = async () => {
    setLoading(true);
    try {
      const res = await providerService.getDataSources();
      setSourcesInfo(res);
    } catch (err) {
      console.error('Error fetching data sources catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const runSampleQuery = async (domain = activeQueryDomain, sector = selectedSector) => {
    setQueryLoading(true);
    try {
      let res;
      if (domain === 'weather') {
        res = await providerService.getWeather(sector.lat, sector.lon, sector.name);
      } else if (domain === 'ocean') {
        res = await providerService.getOceanConditions(sector.lat, sector.lon);
      } else if (domain === 'pfz') {
        res = await providerService.getPFZs(sector.lat, sector.lon);
      } else if (domain === 'advisory') {
        res = await providerService.getAdvisories(sector.lat, sector.lon);
      } else if (domain === 'geospatial') {
        res = await providerService.getGeospatialZones(sector.lat, sector.lon);
      }
      setQueryResult(res);
    } catch (err) {
      setQueryResult({ error: err.message || 'Query failed' });
    } finally {
      setQueryLoading(false);
    }
  };

  useEffect(() => {
    runSampleQuery(activeQueryDomain, selectedSector);
  }, [activeQueryDomain, selectedSector]);

  const providerIcons = {
    weather: CloudSun,
    ocean: Waves,
    pfz: Compass,
    advisory: BellRing,
    geospatial: MapPin
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Data Provider Architecture</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-success-surface border border-success/30 text-success font-medium">
              Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Decoupled data provider contracts, abstraction layers, and fallback registries
          </p>
        </div>

        <button
          onClick={loadSources}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-secondary hover:bg-surface-tertiary border border-border rounded-xl text-xs text-foreground transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Providers</span>
        </button>
      </div>

      {/* Provider Architecture Schematic Card */}
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground text-sm">Provider Decoupling Pipeline</h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">Strict Interface Compliance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 rounded-xl bg-surface-secondary border border-border space-y-1">
            <span className="text-[10px] uppercase font-mono text-primary font-bold">Layer 1</span>
            <div className="font-bold text-foreground">UI / Dashboard</div>
            <p className="text-[10px] text-muted-foreground">React Frontend Components</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-secondary border border-border space-y-1">
            <span className="text-[10px] uppercase font-mono text-primary font-bold">Layer 2</span>
            <div className="font-bold text-foreground">Backend Services</div>
            <p className="text-[10px] text-muted-foreground">Business Logic & Verification</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-secondary border border-border space-y-1">
            <span className="text-[10px] uppercase font-mono text-primary font-bold">Layer 3</span>
            <div className="font-bold text-foreground">Provider Interface</div>
            <p className="text-[10px] text-muted-foreground">IWeather, IOcean, IPFZs</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-secondary border border-border space-y-1">
            <span className="text-[10px] uppercase font-mono text-accent font-bold">Layer 4</span>
            <div className="font-bold text-foreground">Mock / Real Satellite</div>
            <p className="text-[10px] text-muted-foreground">INCOIS, IMD, Sentinel-3</p>
          </div>
        </div>
      </div>

      {/* 5 Registered Provider Cards */}
      <div>
        <h3 className="font-bold text-foreground text-sm mb-3">Registered Data Providers ({sourcesInfo?.registeredProvidersCount || 5})</h3>
        
        {loading && !sourcesInfo ? (
          <div className="h-40 flex items-center justify-center bg-surface-secondary/40 rounded-2xl border border-border">
            <LoadingSpinner message="Querying provider registry..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sourcesInfo?.providers?.map((provider) => {
              const IconComponent = providerIcons[provider.domain] || Database;
              return (
                <div
                  key={provider.domain}
                  className="p-5 rounded-2xl bg-surface border border-border space-y-3 relative overflow-hidden shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-xs uppercase tracking-wide">
                          {provider.domain} Provider
                        </h4>
                        <span className="text-[10px] font-mono text-muted-foreground">v{provider.version}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-success-surface border border-success/30 text-success font-semibold">
                      {provider.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="text-foreground font-mono text-[11px] truncate font-medium">
                      {provider.name}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
                      <span>Mode: <strong className="text-warning font-mono">{provider.isMock ? 'Demo Data' : 'Live Feed'}</strong></span>
                      <span>Latency: <strong className="text-accent font-mono">{provider.latencyMs}ms</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Provider Query Sandbox */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-accent" />
            <h3 className="font-bold text-foreground text-sm">Provider Query Sandbox</h3>
          </div>

          {/* Sector Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Target Sector:</span>
            <select
              value={selectedSector.name}
              onChange={(e) => {
                const sec = SECTORS.find((s) => s.name === e.target.value) || SECTORS[0];
                setSelectedSector(sec);
              }}
              className="bg-surface-secondary border border-border rounded-lg px-2.5 py-1 text-xs text-foreground font-medium focus:outline-none"
            >
              {SECTORS.map((s) => (
                <option key={s.name} value={s.name} className="bg-surface text-foreground">
                  {s.name} ({s.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Domain Tabs */}
        <div className="flex flex-wrap gap-2">
          {['weather', 'ocean', 'pfz', 'advisory', 'geospatial'].map((domain) => (
            <button
              key={domain}
              onClick={() => setActiveQueryDomain(domain)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                activeQueryDomain === domain
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-surface-secondary text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {domain} Provider
            </button>
          ))}
        </div>

        {/* Query Response Viewer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Query Payload & Evidence Audit:</span>
            {queryResult?.source && (
              <span className="font-mono text-[11px] text-primary">
                Dataset: {queryResult.source.dataset}
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-surface-secondary border border-border font-mono text-xs text-foreground overflow-x-auto max-h-[340px]">
            {queryLoading ? (
              <div className="py-8 flex items-center justify-center">
                <LoadingSpinner size="sm" message="Executing provider retrieval..." />
              </div>
            ) : (
              <pre className="leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(queryResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
