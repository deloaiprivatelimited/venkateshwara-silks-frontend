import React, { useEffect, useState } from "react";
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
import { Link2, Check, Copy } from "lucide-react";
// import { useInviteLink } from "../hooks/useInviteLink";
import { useInviteLink } from "../api/useInvite";
// --- Types ---
interface DashboardStats {
  totalSarees: number;
  totalVarieties: number;
  totalGroups: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // --- State ---
  const [stats, setStats] = useState<DashboardStats>({
    totalSarees: 0,
    totalVarieties: 0,
    totalGroups: 0,
  });
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("Admin");
const { createInvite, isCreating, copied } = useInviteLink();

  // --- Helpers ---
  const getAuthHeader = () => ({
    Authorization: `Bearer ${
      localStorage.getItem("token")?.replace(/^"|"$/g, "") || ""
    }`,
    "Content-Type": "application/json",
  });

  const formatDate = () =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // --- Fetch Dashboard Stats ---
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/admin/dashboard/stats`,
          {
            method: "GET",
            headers: getAuthHeader(),
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }

        const data = await res.json();

        setStats({
          totalSarees: data.sarees || 0,
          totalVarieties: data.varieties || 0,
          totalGroups: data.categories || 0,
        });

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed.username) setUsername(parsed.username);
          } catch {
            /* ignore */
          }
        }
      } catch (error) {
        console.error("Dashboard API error:", error);
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
  }: {
    title: string;
    count: number;
    icon: any;
    link: string;
  }) => (
    <div
      onClick={() => navigate(link)}
      className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 uppercase font-semibold">
            {title}
          </p>
          <h3 className="text-3xl font-extrabold text-gray-900 mt-2">
            {loading ? "..." : count}
          </h3>
        </div>
        <div className="p-3 bg-orange-50 rounded-xl">
          <Icon size={24} className="text-[#e1601f]" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#e1601f] opacity-0 group-hover:opacity-100 transition-opacity">
        <span>View Details</span>
        <ArrowUpRight size={16} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 p-6 overflow-y-auto">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
          <Calendar size={14} />
          <span>{formatDate()}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">
          Welcome back,{" "}
          <span className="text-[#e1601f]">{username}</span>
        </h1>
        <p className="text-gray-500 mt-2">
          Inventory overview and system insights.
        </p>
      </div>
<div
  onClick={createInvite}
  className="cursor-pointer bg-white border rounded-2xl p-6 hover:shadow-md transition-all group"
>
  <div className="flex items-center gap-3">
    <div className="p-3 bg-orange-50 rounded-xl">
      {copied ? (
        <Check className="text-[#e1601f]" size={22} />
      ) : (
        <Link2 className="text-[#e1601f]" size={22} />
      )}
    </div>

    <div className="flex-1">
      <h4 className="font-bold text-gray-900">
        {copied ? "Invite Copied!" : "Create Invite Link"}
      </h4>
      <p className="text-sm text-gray-500">
        {isCreating ? "Generating link..." : "Share access securely"}
      </p>
    </div>

    <Copy className="text-gray-300 group-hover:text-[#e1601f]" size={18} />
  </div>
</div>

      {/* Stats */}
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
          />
          <StatCard
            title="Total Varieties"
            count={stats.totalVarieties}
            icon={Layers}
            link="/varieties"
          />
          <StatCard
            title="Total Categories"
            count={stats.totalGroups}
            icon={Users}
            link="/groups"
          />
        </div>
      )}

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-gray-900 text-white rounded-2xl p-6">
          <div className="flex justify-between mb-3">
            <h3 className="font-bold">System Status</h3>
            <Activity className="text-green-400" size={18} />
          </div>
          <p className="text-green-400 text-sm">All Systems Operational</p>
          <p className="text-gray-400 text-xs mt-2">API: Stable</p>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-center">
          <TrendingUp className="mx-auto text-[#e1601f]" size={28} />
          <h4 className="font-bold mt-2">Growth Insight</h4>
          <p className="text-sm text-gray-600 mt-1">
            Managing <b>{stats.totalVarieties}</b> varieties efficiently.
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-6">
          <CheckCircle2 className="text-[#e1601f]" size={24} />
          <h4 className="font-semibold mt-2">Pro Tip</h4>
          <p className="text-xs text-gray-500 mt-1">
            Add at least 2 images per saree to increase engagement.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
