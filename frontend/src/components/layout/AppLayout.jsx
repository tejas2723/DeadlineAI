import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * AppLayout component serves as the persistent layout wrap for authenticated views,
 * maintaining Navbar headers, Sidebar listings, and content frames.
 */
const AppLayout = ({ children, pageTitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile backdrop click-away overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main layout container */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar
          onMenuToggle={() => setSidebarOpen(true)}
          pageTitle={pageTitle}
        />
        
        {/* Page specific contents */}
        <main className="flex-1 pt-20 px-4 pb-4 md:pt-24 md:px-6 md:pb-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
