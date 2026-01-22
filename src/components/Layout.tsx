import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export const Layout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const location = useLocation();

  /* ---------- Close sidebar on route change (mobile UX fix) ---------- */
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  /* ---------- Page title formatting ---------- */
  const pageSegment = location.pathname.split("/")[1] || "dashboard";
  const formattedTitle = pageSegment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <div className="flex max-h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
        {/* Header */}
        {/* <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>

            <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">
              {formattedTitle}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full w-64">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>

            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
              <Bell size={20} />
            </button>

            <img
              src="https://i.pravatar.cc/100?img=11"
              className="w-9 h-9 rounded-full ring-2 ring-orange-100"
              alt="Profile"
            />
          </div>
        </header> */}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
