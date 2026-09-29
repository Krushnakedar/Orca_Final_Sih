import React from 'react';
import { Link } from 'react-router-dom';
import {
  Waves,
  ShieldCheck,
  Compass,
  Radio,
  ExternalLink,
  Heart,
  Anchor,
  Activity
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface border-t border-border mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-border/80">
          {/* Col 1 & 2: Platform Identity */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-ocean-600 via-primary to-accent flex items-center justify-center text-white shadow-md shadow-primary/20">
                <Waves className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-black text-lg tracking-wider text-foreground">ORCA</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Autonomous multi-agent marine intelligence and operational telemetry platform correlating satellite earth observation, oceanographic models, and meteorological forecasts into deterministic risk assessments.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-secondary border border-border text-[11px] font-mono text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span>Deterministic Risk Engine Active</span>
              </div>
            </div>
          </div>

          {/* Col 3: Operational Cockpit */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Operations
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/dashboard" className="hover:text-primary transition-colors">
                  Telemetry Dashboard
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-primary transition-colors">
                  Interactive GIS Map
                </Link>
              </li>
              <li>
                <Link to="/routes" className="hover:text-primary transition-colors">
                  Safe Route Planner
                </Link>
              </li>
              <li>
                <Link to="/pfz" className="hover:text-primary transition-colors">
                  PFZ Satellite Advisories
                </Link>
              </li>
              <li>
                <Link to="/alerts" className="hover:text-primary transition-colors">
                  Emergency Broadcasts
                </Link>
              </li>
              <li>
                <Link to="/chat" className="hover:text-primary transition-colors">
                  AI Marine Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Data Providers & Science */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Data Providers
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-1">
                <span>INCOIS WebGIS (ESSO)</span>
              </li>
              <li className="flex items-center gap-1">
                <span>IMD Pune Meteorological</span>
              </li>
              <li className="flex items-center gap-1">
                <span>Copernicus Marine (CMEMS)</span>
              </li>
              <li className="flex items-center gap-1">
                <span>Sentinel-3 & Oceansat</span>
              </li>
              <li className="flex items-center gap-1">
                <span>Indian Coast Guard VHF</span>
              </li>
            </ul>
          </div>

          {/* Col 5: Security & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Compliance & Safety
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/history" className="hover:text-primary transition-colors">
                  Immutable Decision Audit
                </Link>
              </li>
              <li className="text-muted-foreground/80">
                UNCLOS Maritime EEZ
              </li>
              <li className="text-muted-foreground/80">
                Naval Firing Perimeter Avoidance
              </li>
              <li className="text-muted-foreground/80">
                Marine Protected Areas (MPA)
              </li>
              <li className="text-muted-foreground/80">
                Offline PWA Outbox Cache
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>&copy; {currentYear} ORCA Marine Intelligence.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono text-muted-foreground">
              SHA-256 Auth
            </span>
            <ThemeToggle size="sm" showLabel={false} />
          </div>
        </div>
      </div>
    </footer>
  );
}
