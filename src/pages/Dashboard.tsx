import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  Layers, 
  Users, 
  ArrowUpRight, 
  Calendar,
  Loader2
} from "lucide-react";

// --- Types ---
interface DashboardStats {
  totalSarees: number;
  totalVarieties: number;
  totalGroups: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  
  // --- Theme Constants ---
  const THEME = {
    primary: "#e1601f",
    primaryLight: "rgba(225, 96, 31, 0.1)",
  };

  // --- State ---
  const [stats, setStats] = useState<DashboardStats>({
    totalSarees: 0,
    totalVarieties: 0,
    totalGroups: 0,
  });
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("Admin");

  // --- Helpers ---
  const getAuthHeader = () => ({
    "Authorization": `Bearer ${localStorage.getItem("token")?.replace(/^"|"$/g, '') || ""}`, 
    "Content-Type": "application/json"
  });

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // --- Fetch Data ---
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [sareesRes, varietiesRes, groupsRes] = await Promise.all([
          fetch(`${API_BASE}/sarees?per_page=1`, { headers: getAuthHeader() }),
          fetch(`${API_BASE}/admin/varieties?per_page=1`, { headers: getAuthHeader() }),
          fetch(`${API_BASE}/admin/groups?per_page=1`, { headers: getAuthHeader() }) 
        ]);

        const sareesData = sareesRes.ok ? await sareesRes.json() : { total: 0 };
        const varietiesData = varietiesRes.ok ? await varietiesRes.json() : { total: 0 };
        const groupsData = groupsRes.ok ? await groupsRes.json() : { total: 0 };

        setStats({
          totalSarees: sareesData.total || 0,
          totalVarieties: varietiesData.total || 0,
          totalGroups: groupsData.total || 0,
        });

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (parsed.name) setUsername(parsed.name);
            } catch (e) { /* ignore */ }
        }

      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [API_BASE]);

  // --- Components ---
  const StatCard = ({ 
    title, 
    count, 
    icon: Icon, 
    link, 
    colorClass,
    delay 
  }: { 
    title: string; 
    count: number; 
    icon: any; 
    link: string; 
    colorClass: string;
    delay: string;
  }) => (
    <div 
      onClick={() => navigate(link)}
      className={`group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 ${delay}`}
    >
      <div className="flex justify-between items-start">
        <div className="relative z-10">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{loading ? "..." : count}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} style={{ color: THEME.primary }} />
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#e1601f] opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
        <span>View Details</span>
        <ArrowUpRight size={16} />
      </div>

      {/* Decorative Background Blob */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-8 p-4 sm:p-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <Calendar size={14} />
            <span>{formatDate()}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, <span className="text-[#e1601f]">{username}</span>
        </h1>
        <p className="text-gray-500 mt-2 max-w-lg">
            Here is what's happening with your inventory today.
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#e1601f]" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Total Sarees" 
              count={stats.totalSarees} 
              icon={ShoppingBag} 
              link="/sarees"
              colorClass="bg-orange-50"
              delay="delay-0"
            />
            <StatCard 
              title="Total Varieties" 
              count={stats.totalVarieties} 
              icon={Layers} 
              link="/varieties"
              colorClass="bg-orange-50"
              delay="delay-100"
            />
            <StatCard 
              title="Total Groups" 
              count={stats.totalGroups} 
              icon={Users} 
              link="/groups"
              colorClass="bg-orange-50"
              delay="delay-200"
            />
        </div>
      )}
    </div>
  );
};

export default Dashboard;