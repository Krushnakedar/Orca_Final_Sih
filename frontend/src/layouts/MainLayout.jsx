import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import OfflineBanner from '../components/OfflineBanner';
import BackOnlineToast from '../components/BackOnlineToast';
import SyncFailurePanel from '../components/SyncFailurePanel';

export default function MainLayout({ children, apiStatus }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      <Header apiStatus={apiStatus} onMenuClick={() => setIsMobileNavOpen(true)} />
      <OfflineBanner />
      <div className="px-4 sm:px-6 lg:px-8 pt-2 max-w-7xl w-full mx-auto flex-shrink-0">
        <SyncFailurePanel />
      </div>
      {/* min-h-0 is critical: allows flex children to shrink below their natural height so sidebar scrolls independently */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950 w-full min-w-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <BackOnlineToast />
    </div>
  );
}