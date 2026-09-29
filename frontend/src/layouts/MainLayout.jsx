import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Waves } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';
import PublicNavbar from './PublicNavbar';
import Footer from './Footer';
import ThemeToggle from '../components/ThemeToggle';
import OfflineBanner from '../components/OfflineBanner';
import BackOnlineToast from '../components/BackOnlineToast';
import SyncFailurePanel from '../components/SyncFailurePanel';

export default function MainLayout({ children, apiStatus }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // 1. Marketing / Landing Page Layout
  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
        <PublicNavbar apiStatus={apiStatus} />
        <OfflineBanner />
        <main className="flex-1 w-full">
          {children}
        </main>
        <Footer />
        <BackOnlineToast />
      </div>
    );
  }

  // 2. Focused Auth Layout (Login / Register)
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
        {/* Simple top bar for auth pages */}
        <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-border bg-surface/80 backdrop-blur-md flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-ocean-600 via-primary to-accent flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Waves className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-black text-lg tracking-wider text-foreground">ORCA</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
            <Link
              to="/"
              className="text-xs text-muted-foreground hover:text-foreground transition font-medium"
            >
              &larr; Back to Home
            </Link>
          </div>
        </header>
        <OfflineBanner />
        <main className="flex-1 flex items-center justify-center p-4">
          {children}
        </main>
        <BackOnlineToast />
      </div>
    );
  }

  // 3. Operational Cockpit Layout (Dashboard, Map, Routes, Alerts, PFZ, Chat, History, Profile, Sources)
  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden transition-colors duration-200">
      <Header apiStatus={apiStatus} onMenuClick={() => setIsMobileNavOpen(true)} />
      <OfflineBanner />
      <div className="px-4 sm:px-6 lg:px-8 pt-2 max-w-7xl w-full mx-auto flex-shrink-0">
        <SyncFailurePanel />
      </div>
      {/* min-h-0 is critical: allows flex children to shrink below their natural height so sidebar scrolls independently */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background w-full min-w-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <BackOnlineToast />
    </div>
  );
}