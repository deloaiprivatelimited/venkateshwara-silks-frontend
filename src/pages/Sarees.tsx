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
  Check,
  LayoutList,
  ArrowDownUp,
  ArrowUpAZ,
  ArrowDownZA
} from "lucide-react";
import ImageUpload from "../components/saree/ImageUpload"; 

// --- Types ---
interface Saree {
  id: string;
  name: string;
  image_urls: string[];
  variety: string;
  remarks: string;
  min_price: number;
  max_price: number;
  status: "published" | "unpublished"; 
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

type SortOrder = "asc" | "desc";
type SortField = "name" | "min_price" | "created_at";

// --- Internal Component: Searchable Select Dropdown (For Modal) ---
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
      <div 
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 rounded-lg border bg-white flex items-center justify-between cursor-pointer transition-all text-sm
          ${isOpen ? 'border-[#e1601f] ring-1 ring-[#e1601f]' : 'border-gray-200 hover:border-gray-300'}
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {isLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white rounded-t-lg">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 rounded-md bg-gray-50 border-none text-xs outline-none focus:bg-gray-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { onChange(opt.name); setIsOpen(false); setSearchTerm(""); }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-md flex items-center justify-between transition-colors
                    ${value === opt.name ? 'bg-[#e1601f]/10 text-[#e1601f] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
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

  // --- Constants for Theme ---
  const THEME = {
    primary: "#e1601f",
    primaryHover: "#c24e12",
    dark: "#36454F",
  };

  // State
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [varieties, setVarieties] = useState<VarietyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVarieties, setLoadingVarieties] = useState(false);
  
  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [varietyFilter, setVarietyFilter] = useState(""); // This holds the dropdown value
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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
    status: "published" as "published" | "unpublished"
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- Helpers ---
  const getAuthHeader = () => ({
    "Authorization": `Bearer ${localStorage.getItem("token")?.replace(/^"|"$/g, '') || ""}`, 
    "Content-Type": "application/json"
  });

  // --- API Calls ---
  const fetchVarieties = useCallback(async () => {
    setLoadingVarieties(true);
    try {
      const response = await fetch(`${API_BASE}/admin/varieties?limit=100`, { headers: getAuthHeader() });
      if (response.ok) {
        const data = await response.json();
        setVarieties(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error fetching varieties:", error);
    } finally {
      setLoadingVarieties(false);
    }
  }, [API_BASE]);

  const fetchSarees = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: pagination.per_page.toString(),
        search: searchQuery,
        sort_by: sortBy,
        order: sortOrder,
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
  }, [searchQuery, varietyFilter, sortBy, sortOrder, pagination.page, pagination.per_page]);

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

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= pagination.total_pages) {
      setPagination((prev) => ({ ...prev, page }));
    }
  };

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPagination((prev) => ({
      ...prev,
      per_page: Number(e.target.value),
      page: 1,
    }));
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // --- Effects ---
  useEffect(() => {
    fetchVarieties(); // Fetch varieties on mount for the dropdown
  }, [fetchVarieties]);

  useEffect(() => {
    const timer = setTimeout(() => fetchSarees(), 300);
    return () => clearTimeout(timer);
  }, [fetchSarees]);

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
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 p-2 sm:p-4">
      
      {/* Top Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Saree Inventory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your product catalog and pricing
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white transition-all duration-200 rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ backgroundColor: THEME.primary }}
        >
          <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 from-transparent via-transparent to-black"></span>
          <span className="relative flex items-center gap-2">
            <Plus size={18} />
            Add Saree
          </span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
        
        {/* Left: Search */}
        <div className="relative w-full md:flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400 group-focus-within:text-[#e1601f] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by saree name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 transition-all duration-200 sm:text-sm"
            style={{ 
                '--tw-ring-color': THEME.primary,
                '--tw-border-opacity': 1,
            } as React.CSSProperties}
          />
        </div>

        <hr className="md:hidden border-gray-100" />

        {/* Right: Filters & Sort */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            
            {/* Variety Filter DROPDOWN (Replaced Input) */}
            <div className="relative w-full sm:w-48">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter size={16} className="text-gray-400" />
                </div>
                <select
                    value={varietyFilter}
                    onChange={(e) => {
                        setVarietyFilter(e.target.value);
                        setPagination(prev => ({ ...prev, page: 1}));
                    }}
                    className="block w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg cursor-pointer bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 transition-colors appearance-none text-gray-700 font-medium"
                    style={{ '--tw-ring-color': THEME.primary } as React.CSSProperties}
                >
                    <option value="">All Varieties</option>
                    {varieties.map((v) => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown size={14} className="text-gray-400" />
                </div>
            </div>

            {/* Divider (hidden on mobile) */}
            <div className="hidden sm:block w-px h-8 bg-gray-200 mx-1"></div>

            {/* Sort Dropdown */}
            <div className="flex w-full sm:w-auto gap-2">
                <div className="relative w-full sm:w-40">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LayoutList size={16} className="text-gray-400" />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value as SortField);
                            setPagination(prev => ({ ...prev, page: 1}));
                        }}
                        className="block w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg cursor-pointer bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 transition-colors appearance-none text-gray-700 font-medium"
                        style={{ '--tw-ring-color': THEME.primary } as React.CSSProperties}
                    >
                        <option value="created_at">Date Added</option>
                        <option value="name">Name</option>
                        <option value="min_price">Price</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <ArrowDownUp size={14} className="text-gray-400" />
                    </div>
                </div>

                {/* Sort Order Toggle */}
                <button
                    onClick={toggleSortOrder}
                    className="flex-shrink-0 flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-1 transition-all duration-200 bg-white"
                    style={{ '--tw-ring-color': THEME.primary } as React.CSSProperties}
                    title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                    {sortOrder === "asc" ? (
                        <ArrowUpAZ size={20} className="text-gray-600" />
                    ) : (
                        <ArrowDownZA size={20} className="text-gray-600" />
                    )}
                </button>
            </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-auto relative">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-[#e1601f]" size={40} />
              <p className="text-gray-400 text-sm animate-pulse">Loading inventory...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider select-none w-20">Image</th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider select-none">Name</th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider select-none">Variety</th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider select-none">Price Range</th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider select-none">Status</th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right select-none">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {sarees.length ? (
                  sarees.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-[#e1601f]/[0.02] transition-colors duration-150 group"
                    >
                      <td className="px-6 py-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                          {item.image_urls?.[0] ? (
                            <img src={item.image_urls[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={16} className="text-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                          <div className="font-semibold text-gray-800 text-sm group-hover:text-[#e1601f] transition-colors">
                              {item.name}
                          </div>
                          {item.remarks && <div className="text-xs text-gray-400 truncate max-w-[150px]">{item.remarks}</div>}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                          {item.variety}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-600">
                         ₹{item.min_price} - ₹{item.max_price}
                      </td>
                      <td className="px-6 py-3">
                        <span 
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                            item.status === 'published' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:text-[#e1601f]"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                          <Search size={48} className="mb-4 opacity-20" />
                          <p className="text-base font-medium text-gray-500">No sarees found</p>
                          <p className="text-sm mt-1">Try adjusting your search filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-700">Rows:</span>
            <select
              value={pagination.per_page}
              onChange={handlePerPageChange}
              className="bg-white border border-gray-200 text-gray-700 text-sm rounded-md focus:ring-1 focus:border-[#e1601f] focus:ring-[#e1601f] block p-1.5 outline-none cursor-pointer hover:border-gray-300 transition-colors"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="hidden sm:inline ml-2 text-gray-400">|</span>
            <span className="hidden sm:inline ml-2">
                Showing <span className="font-bold text-gray-800">{pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.per_page) + 1}</span> - <span className="font-bold text-gray-800">{Math.min(pagination.page * pagination.per_page, pagination.total)}</span> of <span className="font-bold text-gray-800">{pagination.total}</span>
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:border-[#e1601f] hover:text-[#e1601f] bg-white text-gray-600 transition-all duration-200 shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex items-center justify-center h-9 min-w-[36px] px-3 rounded-lg text-sm font-bold text-white shadow-sm" style={{ backgroundColor: THEME.primary }}>
                {pagination.page}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages || pagination.total === 0}
              className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:border-[#e1601f] hover:text-[#e1601f] bg-white text-gray-600 transition-all duration-200 shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between mb-6 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingSaree ? "Edit Saree" : "Add New Saree"}</h2>
                <p className="text-sm text-gray-500 mt-1">Fill in the details for your inventory item.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors h-fit">
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
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#e1601f] focus:ring-1 focus:ring-[#e1601f] transition-all text-sm" 
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
                      onChange={e => setFormData({...formData, status: e.target.value as "published" | "unpublished"})} 
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none focus:border-[#e1601f] focus:ring-1 focus:ring-[#e1601f] text-sm"
                    >
                      <option value="published">Published</option>
                      <option value="unpublished">Unpublished</option>
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
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#e1601f] focus:ring-1 focus:ring-[#e1601f] text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Max Price</label>
                      <input type="number" required min="0" 
                        value={formData.max_price} 
                        onChange={e => setFormData({...formData, max_price: Number(e.target.value)})} 
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#e1601f] focus:ring-1 focus:ring-[#e1601f] text-sm" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Remarks</label>
                    <textarea rows={4} 
                      value={formData.remarks} 
                      onChange={e => setFormData({...formData, remarks: e.target.value})} 
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#e1601f] focus:ring-1 focus:ring-[#e1601f] text-sm resize-none" 
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium transition-colors text-sm">Cancel</button>
                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex-1 py-3 rounded-xl text-white font-medium flex justify-center gap-2 transition-colors text-sm shadow-md"
                    style={{ backgroundColor: THEME.primary }}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingSaree ? "Update Saree" : "Create Saree")}
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