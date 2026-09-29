import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Waves,
  Menu,
  X,
  ArrowRight,
  LogIn,
  LayoutDashboard,
  ShieldCheck,
  Compass,
  Radio,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';
import Button from '../components/common/Button';

export default function PublicNavbar({ apiStatus }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Capabilities', href: '#features' },
    { name: 'Intelligence Grid', href: '#architecture' },
    { name: 'Sectors & Fleet', href: '#sectors' },
  ];

  const handleScrollTo = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/85 backdrop-blur-md border-b border-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-ocean-600 via-primary to-accent flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <Waves className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-wider text-foreground">ORCA</span>
            </div>
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              Marine Intelligence & Safety Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((item) => (
            item.href.startsWith('#') ? (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleScrollTo(e, item.href)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {item.name}
              </a>
            ) : (
              <Link
                key={item.name}
                to={item.href}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            )
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Heartbeat Status Dot */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-secondary border border-border text-[11px] font-mono text-muted-foreground">
            <span
              className={`w-2 h-2 rounded-full ${
                apiStatus?.connected ? 'bg-success animate-pulse' : 'bg-danger'
              }`}
            />
            <span>{apiStatus?.connected ? 'Grid Online' : 'Connecting'}</span>
          </div>

          <ThemeToggle size="sm" />

          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="sm" variant="primary" icon={LayoutDashboard}>
                Command Center
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button size="sm" variant="ghost">
                  Sign In
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="sm" variant="primary" icon={ArrowRight} iconPosition="right">
                  Launch Command Center
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle size="sm" />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-surface-secondary border border-border text-foreground hover:bg-surface-tertiary transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border bg-surface px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((item) => (
              item.href.startsWith('#') ? (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleScrollTo(e, item.href)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-secondary transition"
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-secondary transition"
                >
                  {item.name}
                </Link>
              )
            ))}
          </nav>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs text-muted-foreground">Grid Status:</span>
              <span className="text-xs font-mono font-semibold text-success flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {apiStatus?.connected ? 'Operational' : 'Reconnecting'}
              </span>
            </div>

            {isAuthenticated ? (
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full" size="md" variant="primary" icon={LayoutDashboard}>
                  Command Center
                </Button>
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full" size="md" variant="outline">
                    Sign In
                  </Button>
                </Link>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full" size="md" variant="primary">
                    Command Center
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
