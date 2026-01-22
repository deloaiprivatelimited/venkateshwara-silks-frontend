import React from "react";
import { Layers, Grid, Users, Plus, ArrowUpRight, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- Stats Row --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Sarees"
          value="1,257"
          icon={<Layers size={24} />}
          color="orange"
        />
        <StatCard
          title="Total Varieties"
          value="82"
          icon={<Grid size={24} />}
          color="blue"
        />
        <StatCard
          title="Total Groups"
          value="15"
          icon={<Users size={24} />}
          color="purple"
        />
      </div>

      {/* --- Main Content Split --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left: Recent Inventory Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-800">Recent Inventory</h3>
              <p className="text-sm text-gray-400">Latest items added to the stock</p>
            </div>
            <button 
              onClick={() => navigate('/sarees')}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1 hover:underline"
            >
              View All <ArrowRight size={16} />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs">
                        {item.variety}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{item.price}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick Actions & Alerts */}
        <div className="flex flex-col gap-6">
          
          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <ActionButton 
                label="Add New Saree" 
                icon={<Plus size={18} />} 
                primary 
                onClick={() => console.log("Open Add Saree Modal")} 
              />
              <ActionButton 
                label="Add Variety" 
                icon={<Grid size={18} />} 
                onClick={() => navigate('/varieties')} 
              />
              <ActionButton 
                label="Create Group" 
                icon={<Users size={18} />} 
                onClick={() => navigate('/groups')} 
              />
            </div>
          </div>

          {/* Mini Insight Card */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg shadow-orange-200 p-6 text-white relative overflow-hidden">
             {/* Decorative Circle */}
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
             
             <h4 className="font-semibold text-lg relative z-10">Sales Insight</h4>
             <p className="text-orange-100 text-sm mt-1 mb-4 relative z-10">
               Kanjeevaram Silk sales are up by <strong>40%</strong> this week.
             </p>
             <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-4 py-2 rounded-lg backdrop-blur-sm transition-colors flex items-center gap-2 w-fit relative z-10">
               View Report <ArrowUpRight size={14} />
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;

/* --- Sub-Components & Data --- */

const StatCard = ({ title, value, icon, color }: any) => {
  const colorStyles: Record<string, string> = {
    orange: "bg-orange-50 text-orange-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow h-32">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorStyles[color]} shadow-sm`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h2 className="text-3xl font-bold text-gray-800 mt-1">{value}</h2>
      </div>
    </div>
  );
};

const ActionButton = ({ label, icon, primary, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 ${
      primary
        ? "bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-200"
        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
    }`}
  >
    {icon}
    {label}
  </button>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles =
    status === "In Stock"
      ? "bg-green-50 text-green-700 border-green-100"
      : status === "Low Stock"
      ? "bg-orange-50 text-orange-700 border-orange-100"
      : "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles}`}>
      {status}
    </span>
  );
};

const recentItems = [
  { id: "#SR1257", name: "Kanjeevaram Silk", variety: "Silk", price: "₹12,500", status: "In Stock" },
  { id: "#SR1256", name: "Banarasi Georgette", variety: "Georgette", price: "₹8,200", status: "Low Stock" },
  { id: "#SR1255", name: "Chanderi Cotton", variety: "Cotton", price: "₹2,400", status: "In Stock" },
  { id: "#SR1254", name: "Paithani Silk", variety: "Silk", price: "₹15,000", status: "In Stock" },
];