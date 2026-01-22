import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  Layers, 
  Users, 
  ArrowUpRight, 
  Calendar,
  Loader2,
  Activity,
  CheckCircle2,
  TrendingUp
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
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-8 p-4 sm:p-6 animate-in fade-in duration-500 overflow-y-auto">
      
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
            Here is an overview of your inventory status and recent activities.
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="h-32 flex items-center justify-center">
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

      {/* Widgets Grid (System Status, Growth, Tips) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 flex-1 pb-6">
            
            {/* System Status Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg animate-in fade-in slide-in-from-bottom-8 delay-100 duration-700 relative overflow-hidden h-full flex flex-col justify-center">
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg">System Status</h3>
                        <Activity className="text-green-400" size={20} />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-green-400 font-medium text-sm">All Systems Operational</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">API Connection: Stable</p>
                    <p className="text-gray-400 text-xs">Last Sync: Just now</p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            </div>

            {/* Pro Tip */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-center items-start gap-3 animate-in fade-in slide-in-from-bottom-8 delay-300 duration-700 h-full">
                <div className="p-2 bg-orange-50 rounded-lg text-[#e1601f]">
                    <CheckCircle2 size={24} />
                </div>
                <div>
                    <h5 className="font-semibold text-gray-800 text-sm">Pro Tip</h5>
                    <p className="text-xs text-gray-500 mt-1">Ensure all sarees have at least 2 high-quality images for better catalog presentation to increase user engagement.</p>
                </div>
            </div>

      </div>
    </div>
  );
};

export default Dashboard;