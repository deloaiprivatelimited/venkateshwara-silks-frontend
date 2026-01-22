import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Loader2,
  Filter,
  Image as ImageIcon,
  ChevronDown,
  Check
} from "lucide-react";
import ImageUpload from "../components/saree/ImageUpload"; // Keeping your existing import

// --- Types ---
interface Saree {
  id: string;
  name: string;
  image_urls: string[];
  variety: string;
  remarks: string;
  min_price: number;
  max_price: number;
  status: "published" | "draft" | "archived";
}

interface VarietyOption {
  id: string;
  name: string;
}

interface PaginationState {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

// --- Internal Component: Searchable Select Dropdown ---
// This handles the dropdown UI, search filtering, and selection
const SearchableSelect = ({ 
  value, 
  onChange, 
  options, 
  isLoading, 
  placeholder = "Select..." 
}: {
  value: string;
  onChange: (val: string) => void;
  options: VarietyOption[];
  isLoading: boolean;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Trigger Area */}
      <div 
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 rounded-xl border bg-white flex items-center justify-between cursor-pointer transition-all
          ${isOpen ? 'border-orange-500 ring-2 ring-orange-100' : 'border-gray-200'}
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {isLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border-none text-sm outline-none focus:bg-gray-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { onChange(opt.name); setIsOpen(false); setSearchTerm(""); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-orange-50 hover:text-orange-700 transition-colors
                    ${value === opt.name ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-600'}`}
                >
                  {opt.name}
                  {value === opt.name && <Check size={14} />}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400 text-xs">No results found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Page Component ---
const Sarees: React.FC = () => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // State
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [varieties, setVarieties] = useState<VarietyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVarieties, setLoadingVarieties] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [varietyFilter, setVarietyFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1, per_page: 10, total: 0, total_pages: 1,
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSaree, setEditingSaree] = useState<Saree | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    name: "",
    image_urls: [] as string[],
    variety: "",
    remarks: "",
    min_price: 0,
    max_price: 0,
    status: "published"
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- Helpers ---
  const getAuthHeader = () => ({
    "Authorization": `Bearer ${localStorage.getItem("token") || ""}`, 
    "Content-Type": "application/json"
  });

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      published: "bg-green-50 text-green-700 border-green-100",
      draft: "bg-gray-100 text-gray-600 border-gray-200",
      archived: "bg-red-50 text-red-700 border-red-100",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.draft} capitalize`}>
        {status}
      </span>
    );
  };

  // --- API Calls ---
  const fetchSarees = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: pagination.per_page.toString(),
        search: searchQuery,
      });
      if (varietyFilter) queryParams.append("variety", varietyFilter);

      const response = await fetch(`${API_BASE}/sarees?${queryParams}`, { headers: getAuthHeader() });
      if (response.ok) {
        const data = await response.json();
        setSarees(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          total_pages: Math.ceil(data.total / prev.per_page)
        }));
      }
    } catch (error) {
      console.error("Error fetching sarees:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, varietyFilter, pagination.page]);

  const fetchVarieties = async () => {
    setLoadingVarieties(true);
    try {
      const response = await fetch(`${API_BASE}/admin/varieties?limit=100`, { headers: getAuthHeader() });
      if (response.ok) {
        const data = await response.json();
        // Handle if response is { data: [...] } or just [...]
        setVarieties(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error fetching varieties:", error);
    } finally {
      setLoadingVarieties(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this saree?")) return;
    try {
      const response = await fetch(`${API_BASE}/saree/${id}`, { method: "DELETE", headers: getAuthHeader() });
      if (response.ok) fetchSarees();
    } catch (error) { console.error(error); }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.image_urls.length === 0) {
      alert("Please upload at least one image.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const endpoint = editingSaree ? `/saree/${editingSaree.id}` : `/saree`;
      const method = editingSaree ? "PUT" : "POST";
      
      const payload = {
        ...formData,
        min_price: Number(formData.min_price),
        max_price: Number(formData.max_price),
      };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: getAuthHeader(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save");
      }

      setIsModalOpen(false);
      fetchSarees();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => fetchSarees(), 300);
    return () => clearTimeout(timer);
  }, [fetchSarees]);

  useEffect(() => {
    if (isModalOpen) fetchVarieties();
  }, [isModalOpen]);

  // --- Modal Helpers ---
  const openAddModal = () => {
    setEditingSaree(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (saree: Saree) => {
    setEditingSaree(saree);
    setFormData({
      name: saree.name,
      image_urls: saree.image_urls || [],
      variety: saree.variety,
      remarks: saree.remarks || "",
      min_price: saree.min_price,
      max_price: saree.max_price,
      status: saree.status
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in p-6 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Saree Inventory</h1>
        <button 
          onClick={openAddModal}
          className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <Plus size={18} /> Add Saree
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 focus:bg-white outline-none transition-all text-sm"
          />
        </div>
        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm relative">
           <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
            type="text" 
            placeholder="Filter Variety..." 
            value={varietyFilter}
            onChange={(e) => setVarietyFilter(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 focus:bg-white outline-none transition-all text-sm"
           />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[500px]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-16">Image</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Variety</th>
                    <th className="px-6 py-4">Price Range</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sarees.length > 0 ? (
                    sarees.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                            {item.image_urls?.[0] ? (
                              <img src={item.image_urls[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={16} className="text-gray-300" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{item.name}</div>
                          {item.remarks && <div className="text-xs text-gray-400 truncate max-w-[150px]">{item.remarks}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                            {item.variety}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">
                          ₹{item.min_price} - ₹{item.max_price}
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No sarees found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm mt-auto">
              <span className="text-gray-500">Page {pagination.page} of {pagination.total_pages}</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} 
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} 
                  disabled={pagination.page === pagination.total_pages}
                  className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-gray-800">{editingSaree ? "Edit Saree" : "Add New Saree"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column */}
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Name</label>
                    <input required 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm" 
                      placeholder="Ex: Kanjivaram Silk"
                    />
                  </div>

                  {/* Searchable Select Component Integrated Here */}
                  <div className="relative"> 
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Variety</label>
                    <SearchableSelect 
                      value={formData.variety}
                      onChange={(val) => setFormData({ ...formData, variety: val })}
                      options={varieties}
                      isLoading={loadingVarieties}
                      placeholder="Search variety..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Status</label>
                    <select 
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.value})} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-orange-500 text-sm"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Min Price</label>
                      <input type="number" required min="0" 
                        value={formData.min_price} 
                        onChange={e => setFormData({...formData, min_price: Number(e.target.value)})} 
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-500 text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Max Price</label>
                      <input type="number" required min="0" 
                        value={formData.max_price} 
                        onChange={e => setFormData({...formData, max_price: Number(e.target.value)})} 
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-500 text-sm" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Remarks</label>
                    <textarea rows={4} 
                      value={formData.remarks} 
                      onChange={e => setFormData({...formData, remarks: e.target.value})} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-500 text-sm resize-none" 
                      placeholder="Any additional details..."
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <ImageUpload 
                  initialUrls={formData.image_urls} 
                  onChange={urls => setFormData({...formData, image_urls: urls})} 
                  path="/sarees" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-gray-900 text-white hover:bg-gray-800 font-medium flex justify-center gap-2 transition-colors">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (editingSaree ? "Update Saree" : "Create Saree")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sarees;