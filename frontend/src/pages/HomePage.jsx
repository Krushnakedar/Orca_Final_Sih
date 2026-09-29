import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Waves,
  ArrowRight,
  ShieldCheck,
  Compass,
  Cpu,
  Radio,
  Fish,
  Wind,
  Navigation,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  ExternalLink,
  ChevronRight,
  Shield,
  Activity,
  Anchor,
  Zap,
  Lock
} from 'lucide-react';
import Container from '../components/common/Container';
import Button from '../components/common/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import Badge from '../components/common/Badge';
import { useAuth } from '../hooks/useAuth';

const SECTORS_PREVIEW = [
  { name: 'Mumbai Coast', region: 'Arabian Sea / Western EEZ', risk: 'LOW', score: 24, swell: '1.8m', wind: '18.2 km/h' },
  { name: 'Kochi Harbor', region: 'Arabian Sea / Kerala Coast', risk: 'MODERATE', score: 32, swell: '2.1m', wind: '22.4 km/h' },
  { name: 'Chennai Offshore', region: 'Bay of Bengal / Tamil Nadu', risk: 'LOW', score: 28, swell: '1.4m', wind: '16.8 km/h' },
  { name: 'Visakhapatnam', region: 'Bay of Bengal / Andhra Coast', risk: 'MODERATE', score: 35, swell: '1.9m', wind: '20.1 km/h' },
  { name: 'Porbandar', region: 'Gujarat / Northern Arabian Sea', risk: 'LOW', score: 22, swell: '1.5m', wind: '15.2 km/h' },
];

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: 'Deterministic Risk Engine',
    category: 'Physics-Based Rules',
    description: 'Physical marine boundaries evaluate risks on a 0–100 scale. LLMs cite sensor telemetry and explain reasoning with zero hallucinations.',
    badge: 'Zero Hallucination',
    accent: 'emerald',
  },
  {
    icon: Navigation,
    title: '100% Waterway Route Planning',
    category: 'Navigational Safety',
    description: 'A* sea-lane pathfinding avoids all land barriers, shallow reefs, and naval firing zones, offering real turn-by-turn waypoint directives.',
    badge: 'Collision-Free',
    accent: 'ocean',
  },
  {
    icon: Compass,
    title: 'PFZ Pelagic Intelligence',
    category: 'Satellite Earth Observation',
    description: 'Correlates INCOIS thermal fronts (SST) and Sentinel-3 chlorophyll concentration to pinpoint high-biomass fishing zones.',
    badge: 'INCOIS Validated',
    accent: 'teal',
  },
  {
    icon: Radio,
    title: 'Emergency Operations Center',
    category: 'Broadcast & Distress',
    description: 'Active broadcast alerts synchronized with VHF Channel 16 protocols, distress frequency contacts, and operator acknowledgment logs.',
    badge: 'Channel 16 VHF',
    accent: 'rose',
  },
  {
    icon: Cpu,
    title: 'Agentic Multi-Agent Orchestrator',
    category: 'Autonomous Systems',
    description: 'Executes parallel task DAGs decomposing weather, oceanographic swell, and advisory queries with natural language support.',
    badge: 'Multi-Agent DAG',
    accent: 'indigo',
  },
  {
    icon: Zap,
    title: 'Offline-First PWA Resilience',
    category: 'Zero-Connectivity Operation',
    description: 'IndexedDB caching and client-side mutation outbox queues allow complete operational continuity during open ocean deep-sea voyages.',
    badge: 'Offline Outbox',
    accent: 'amber',
  },
];

const OPERATOR_ROLES = [
  {
    role: 'Artisanal & Fleet Fishermen',
    benefit: 'Target high-yield PFZ zones, receive instant cyclone warnings, and navigate verified safe waterways in regional languages.',
  },
  {
    role: 'Indian Coast Guard & Coastal Police',
    benefit: 'Monitor geofence perimeters, track naval restricted zones, and coordinate emergency broadcasts across coastal sectors.',
  },
  {
    role: 'Disaster Management & Port Authorities',
    benefit: 'Automated meteorological risk calculation, real-time wave height alerts, and tamper-proof audit trails for safety compliance.',
  },
  {
    role: 'Marine Researchers & Oceanographers',
    benefit: 'Access decoupled multi-provider data layers (Copernicus CMEMS, INCOIS, IMD) with standardized REST interface contracts.',
  },
];

export default function HomePage({ apiStatus }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeSectorIndex, setActiveSectorIndex] = useState(0);
  const activeSector = SECTORS_PREVIEW[activeSectorIndex];

  return (
    <div className="space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-12 sm:pb-24 border-b border-border">
        {/* Subtle Ambient Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <Container className="relative z-10 text-center max-w-5xl mx-auto space-y-8">
          {/* Top Pill / Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-secondary border border-border shadow-sm">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-semibold text-foreground">
              Marine Intelligence & Safety Platform
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-foreground tracking-tight leading-[1.1]">
              Autonomous Marine <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-sky-500 to-accent">
                Intelligence & Telemetry
              </span>
            </h1>

            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Correlating satellite imagery, oceanographic models, and weather forecasts to support safer routing and fishing zone decisions.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" icon={ArrowRight} iconPosition="right" className="w-full sm:w-auto shadow-md">
                Launch Command Center
              </Button>
            </Link>

            <Link to="/map" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" icon={Layers} className="w-full sm:w-auto">
                Explore GIS Marine Map
              </Button>
            </Link>
          </div>

          {/* Key Facts */}
          <div className="grid grid-cols-2 gap-3 pt-8 max-w-xl mx-auto">
            <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm text-center">
              <div className="text-2xl sm:text-3xl font-black text-primary">5 Sectors</div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">Indian Coastal EEZ</div>
            </div>
            <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm text-center">
              <div className="text-2xl sm:text-3xl font-black text-warning">Offline-First</div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">PWA Mutation Queue</div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. REAL-TIME COASTAL SECTORS TICKER */}
      <section id="sectors" className="scroll-mt-20">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <Badge variant="primary" dot={true}>Live Operational Grid</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-2 tracking-tight">
                Active Indian Marine Sectors
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Real-time oceanographic telemetry, significant wave swell, and physical risk scores.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Select Sector:</span>
              <div className="flex flex-wrap gap-1.5">
                {SECTORS_PREVIEW.map((s, idx) => (
                  <button
                    key={s.name}
                    onClick={() => setActiveSectorIndex(idx)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                      activeSectorIndex === idx
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-surface-secondary text-muted-foreground hover:text-foreground border border-border'
                    }`}
                  >
                    {s.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Sector Snapshot Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-sm relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-6 space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{activeSector.region}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {activeSector.name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Real-time multi-agent aggregation across INCOIS wave buoys, IMD coastal meteorological stations, and Copernicus CMEMS hydrodynamic currents.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Link to={`/dashboard`}>
                    <Button size="sm" variant="primary" icon={ArrowRight} iconPosition="right">
                      Inspect Telemetry
                    </Button>
                  </Link>
                  <Link to="/map">
                    <Button size="sm" variant="secondary" icon={Layers}>
                      View in GIS Center
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="md:col-span-6 grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-surface-secondary border border-border">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase">Risk Score</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-2xl font-black ${activeSector.score > 30 ? 'text-warning' : 'text-success'}`}>
                      {activeSector.score}
                    </span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                    <span className="ml-1 text-[11px] font-bold uppercase text-foreground">({activeSector.risk})</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-1">Deterministic Physics Rules</span>
                </div>

                <div className="p-4 rounded-2xl bg-surface-secondary border border-border">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase">Significant Swell</span>
                  <div className="text-2xl font-black text-accent mt-1">{activeSector.swell}</div>
                  <span className="text-[10px] text-muted-foreground block mt-1">CMEMS Wave Model</span>
                </div>

                <div className="p-4 rounded-2xl bg-surface-secondary border border-border">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase">Wind Velocity</span>
                  <div className="text-2xl font-black text-foreground mt-1">{activeSector.wind}</div>
                  <span className="text-[10px] text-muted-foreground block mt-1">IMD Coastal Forecast</span>
                </div>

                <div className="p-4 rounded-2xl bg-surface-secondary border border-border">
                  <span className="text-[11px] text-muted-foreground font-medium uppercase">Geofence Status</span>
                  <div className="text-2xl font-black text-success mt-1">CLEAR</div>
                  <span className="text-[10px] text-muted-foreground block mt-1">Naval Zones Unbreached</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. CAPABILITIES MATRIX (6 CORE PILLARS) */}
      <section id="features" className="scroll-mt-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <Badge variant="accent" dot={true}>Platform Architecture</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Enterprise Maritime Capabilities
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Designed from first principles to resolve maritime safety, spatial navigation, and operational decision-making under intermittent connectivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <Card key={cap.title} hover={true} className="flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="outline" size="sm">{cap.badge}</Badge>
                    </div>
                    <CardTitle className="mt-4">{cap.title}</CardTitle>
                    <span className="text-[11px] font-mono text-primary font-semibold uppercase">{cap.category}</span>
                    <CardDescription className="mt-1 leading-relaxed">{cap.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Verified Logic
                      </span>
                      <span className="font-mono text-[10px]">Rule-Based</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 4. FOUR-LAYER ARCHITECTURE SCHEMATIC */}
      <section id="architecture" className="scroll-mt-20">
        <Container>
          <div className="p-8 sm:p-12 rounded-3xl bg-surface border border-border shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
              <div>
                <Badge variant="primary" dot={true}>System Architecture</Badge>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2 tracking-tight">
                  Decoupled 4-Layer Intelligence Grid
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Strict interface abstraction ensuring multi-provider failover without breaking frontend state.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-surface-secondary border border-border space-y-2">
                <span className="text-[10px] font-mono font-bold text-primary uppercase">Layer 01</span>
                <h4 className="font-bold text-foreground text-sm">UI & Operational Cockpit</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  React 18 + Tailwind semantic tokens, Leaflet GIS mapping, and IndexedDB offline cache.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-surface-secondary border border-border space-y-2">
                <span className="text-[10px] font-mono font-bold text-sky-500 uppercase">Layer 02</span>
                <h4 className="font-bold text-foreground text-sm">Multi-Agent Orchestrator</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Deterministic risk rules, A* waterway routing algorithm, and LLM explanation synthesis.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-surface-secondary border border-border space-y-2">
                <span className="text-[10px] font-mono font-bold text-accent uppercase">Layer 03</span>
                <h4 className="font-bold text-foreground text-sm">Provider Interface Contracts</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Standardized IWeather, IOcean, IPFZs interfaces with automatic synthetic fallbacks.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-surface-secondary border border-border space-y-2">
                <span className="text-[10px] font-mono font-bold text-success uppercase">Layer 04</span>
                <h4 className="font-bold text-foreground text-sm">Satellite & Agency Feeds</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Live INCOIS GeoServer WMS, IMD Pune observations, Copernicus CMEMS, and Sentinel-3.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. OPERATOR USE CASES */}
      <section className="scroll-mt-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <Badge variant="warning" dot={true}>Stakeholders & Governance</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Built for Diverse Maritime Personas
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering national coastal infrastructure, commercial fleets, and coastal fishing communities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OPERATOR_ROLES.map((persona) => (
              <div
                key={persona.role}
                className="p-6 rounded-2xl bg-surface border border-border flex items-start gap-4 shadow-sm hover:border-border-subtle transition"
              >
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Anchor className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">{persona.role}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{persona.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="scroll-mt-20">
        <Container>
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary/15 via-surface to-accent/15 border border-border shadow-md text-center space-y-6 max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Ready to Get Started with ORCA?
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Sign in to inspect live telemetry, review safety alerts, and plan safe maritime routes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="primary" icon={ArrowRight} iconPosition="right" className="w-full sm:w-auto shadow-md">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground pt-4">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-success" /> JWT Authentication
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-primary" /> UNCLOS Compliant
              </span>
              <span>&bull;</span>
              <span>IndexedDB Sync Engine</span>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
