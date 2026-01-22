import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Layers,
  Grid,
  Users,
  LogOut,
  X,
  Store,
} from "lucide-react";

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 z-20 bg-gray-900/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside
        className={`
          fixed lg:static z-30 h-screen bg-white border-r border-gray-100 
          transition-all duration-300 ease-out flex flex-col
          ${isMobileOpen ? "translate-x-0 w-60" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-16" : "lg:w-60"}
        `}
      >
        {/* Header / Logo Area */}
        <div className={`h-16 flex items-center border-b border-gray-50/50 ${isCollapsed ? "justify-center" : "px-5 justify-between"}`}>
          <div onClick={() => setIsCollapsed(!isCollapsed)} className="flex items-center gap-3 overflow-hidden">
            {/* Logo Icon */}
            <div className="flex-shrink-0 w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-orange-200">
              <Store size={16} strokeWidth={2.5} />
            </div>
            
            {/* Brand Name */}
            <span
              className={`font-light text-gray-800 tracking-tight whitespace-nowrap transition-all duration-300 ${
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              Venkateshwara<span className="font-bold text-orange-600">Silks</span>
            </span>
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          <SidebarLink 
            to="/dashboard" 
            icon={<Home size={20} strokeWidth={1.5} />} 
            label="Dashboard" 
            isCollapsed={isCollapsed} 
            setIsMobileOpen={setIsMobileOpen} 
          />
          <SidebarLink 
            to="/sarees" 
            icon={<Layers size={20} strokeWidth={1.5} />} 
            label="Sarees" 
            isCollapsed={isCollapsed} 
            setIsMobileOpen={setIsMobileOpen} 
          />
          <SidebarLink 
            to="/varieties" 
            icon={<Grid size={20} strokeWidth={1.5} />} 
            label="Varieties" 
            isCollapsed={isCollapsed} 
            setIsMobileOpen={setIsMobileOpen} 
          />
          <SidebarLink 
            to="/groups" 
            icon={<Users size={20} strokeWidth={1.5} />} 
            label="Groups" 
            isCollapsed={isCollapsed} 
            setIsMobileOpen={setIsMobileOpen} 
          />
        </nav>

        {/* Footer Actions */}
        <div className="p-2 border-t border-gray-50 space-y-1">
          {/* Collapse Toggle */}


          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center h-10 rounded-md transition-all duration-200 group
              ${isCollapsed ? "justify-center" : "px-3 gap-3 hover:bg-red-50"}
            `}
          >
            <LogOut 
              size={20} 
              strokeWidth={1.5}
              className="text-gray-400 group-hover:text-red-500 transition-colors" 
            />
            
            <span 
              className={`
                font-medium text-sm text-gray-500 group-hover:text-red-600 whitespace-nowrap overflow-hidden transition-all duration-300
                ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}
              `}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

/* ---------- Compact Sidebar Link ---------- */

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, isCollapsed, setIsMobileOpen }) => (
  <NavLink
    to={to}
    onClick={() => setIsMobileOpen(false)}
    className={({ isActive }) =>
      `group flex items-center h-10 rounded-md transition-all duration-200
       ${isCollapsed ? "justify-center px-0" : "px-3 gap-3"}
       ${isActive 
          ? "bg-orange-50 text-orange-600" 
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        }`
    }
    title={isCollapsed ? label : ""}
  >
    {({ isActive }) => (
      <>
        <span className={`flex-shrink-0 transition-colors duration-200 ${isActive ? "text-orange-600" : "text-gray-400 group-hover:text-gray-600"}`}>
          {icon}
        </span>
        
        <span 
          className={`
            font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300
            ${isCollapsed ? "w-0 opacity-0 translate-x-[-10px]" : "w-auto opacity-100 translate-x-0"}
          `}
        >
          {label}
        </span>
      </>
    )}
  </NavLink>
);