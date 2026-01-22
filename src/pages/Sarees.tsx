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
import api from "../api/axios";

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
type SortField = "name" | "min_price"; // Strictly Name and Price

// --- Internal Component: Searchable Select Dropdown ---
const SearchableSelect = ({ 
  value, 
  onChange, 
  options, 
  isLoading, 
  placeholder = "Select...",
  startIcon,
  className = ""
}: {
  value: string;
  onChange: (val: string) => void;
  options: VarietyOption[];
  isLoading: boolean;
  placeholder?: string;
  startIcon?: React.ReactNode;
  className?: string;
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

  const safeOptions = Array.isArray(options) ? options : [];
  const filteredOptions = safeOptions.filter(opt => 
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      <div 
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        className={`w-full py-2.5 rounded-lg border bg-white flex items-center justify-between cursor-pointer transition-all text-sm
          ${isOpen ? 'border-[#e1601f] ring-1 ring-[#e1601f]' : 'border-gray-200 hover:border-gray-300'}
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
          ${startIcon ? 'pl-10 pr-3' : 'px-4'}
        `}
      >
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {startIcon}
          </div>
        )}
        
        <span className={`truncate ${value ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          {value || placeholder}
        </span>
        
        <div className="flex items-center gap-1 ml-2">
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
                className="w-full pl-9 pr-3 py-2 rounded-md bg-gray-50 border-none text-xs outline-none focus:bg-gray-100 placeholder-gray-400 text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { 
                    onChange(opt.name); 
                    setIsOpen(false); 
                    setSearchTerm(""); 
                  }}
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

  const THEME = {
    primary: "#e1601f",
    primaryHover: "#c24e12",
  };

  // --- State ---
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [varieties, setVarieties] = useState<VarietyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVarieties, setLoadingVarieties] = useState(false);
  
  // --- Filters State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [varietyFilter, setVarietyFilter] = useState(""); 
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

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

  // --- API Calls ---

  const fetchVarieties = useCallback(async () => {
    setLoadingVarieties(true);
    try {
      const res = await api.get("/admin/varieties", { params: { limit: 100 } });
      const data = res.data;
      setVarieties(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching varieties:", error);
    } finally {
      setLoadingVarieties(false);
    }
  }, []);

  const fetchSarees = useCallback(async () => {
    setLoading(true);
    try {
      // Clean params: remove undefined or empty strings to prevent API errors
      const params: any = {
        page: pagination.page,
        per_page: pagination.per_page,
        sort_by: sortBy,
        order: sortOrder,
      };

      if (searchQuery.trim()) params.search = searchQuery;
      if (varietyFilter) params.variety = varietyFilter;

      const res = await api.get("/sarees", { params });
      const data = res.data;
      
      setSarees(data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
        total_pages: Math.ceil((data.total || 0) / prev.per_page) || 1,
      }));
    } catch (error) {
      console.error("Error fetching sarees:", error);
      setSarees([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, varietyFilter, sortBy, sortOrder, pagination.page, pagination.per_page]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this saree?")) return;
    try {
      await api.delete(`/saree/${id}`);
      fetchSarees();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.image_urls.length === 0) {
      alert("Please upload at least one image.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        min_price: Number(formData.min_price),
        max_price: Number(formData.max_price),
      };

      if (editingSaree) {
        await api.put(`/saree/${editingSaree.id}`, payload);
      } else {
        await api.post("/saree", payload);
      }
      setIsModalOpen(false);
      fetchSarees();
    } catch (error: any) {
      alert(`Error: ${error?.response?.data?.message || error.message}`);
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
    fetchVarieties();
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
      
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Saree Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your product catalog and pricing</p>
        </div>
        <button
          onClick={openAddModal}
          className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white transition-all duration-200 rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ backgroundColor: THEME.primary }}
        >
          <span className="relative flex items-center gap-2">
            <Plus size={18} /> Add Saree
          </span>
        </button>
      </div>

      {/* Toolbar */}
      {/* Added z-30 and overflow-visible to allow dropdowns to pop over table */}
      <div className="flex-shrink-0 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between z-30 relative overflow-visible">
        
        {/* Left: Text Search */}
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
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 transition-all duration-200 sm:text-sm"
            style={{ '--tw-ring-color': THEME.primary } as React.CSSProperties}
          />
        </div>

        <hr className="md:hidden border-gray-100" />

        {/* Right: Filters & Sort */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            
            {/* Variety Filter */}
            <div className="w-full sm:w-56 relative z-40">
                <SearchableSelect
                    value={varietyFilter === "" ? "All Varieties" : varietyFilter}
                    onChange={(val) => {
                        const newValue = val === "All Varieties" ? "" : val;
                        setVarietyFilter(newValue);
                        setPagination(prev => ({ ...prev, page: 1}));
                    }}
                    options={[
                        { id: "all", name: "All Varieties" },
                        ...varieties
                    ]}
                    isLoading={loadingVarieties}
                    placeholder="All Varieties"
                    startIcon={<Filter size={16} />}
                />
            </div>

            <div className="hidden sm:block w-px h-8 bg-gray-200 mx-1"></div>

            {/* Sort Controls */}
            <div className="flex w-full sm:w-auto gap-2">
                <div className="relative w-full sm:w-40 z-30">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LayoutList size={16} className="text-gray-400" />
                    </div>
                    
                    {/* Sort Select: Name and Price Only */}
                    <select
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value as SortField);
                            setPagination(prev => ({ ...prev, page: 1}));
                        }}
                        className="block w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg cursor-pointer bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 transition-colors appearance-none text-gray-700 font-medium"
                        style={{ '--tw-ring-color': THEME.primary } as React.CSSProperties}
                    >
                        <option value="name">Name</option>
                        <option value="min_price">Price</option>
                    </select>
                    
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <ArrowDownUp size={14} className="text-gray-400" />
                    </div>
                </div>

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

      {/* Table */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden z-10">
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
                    <tr key={item.id} className="hover:bg-[#e1601f]/[0.02] transition-colors duration-150 group">
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
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${item.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(item)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:text-[#e1601f]">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:text-red-500">
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
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Controls */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-700">Rows:</span>
            <select
              value={pagination.per_page}
              onChange={handlePerPageChange}
              className="bg-white border border-gray-200 text-gray-700 text-sm rounded-md focus:ring-1 focus:border-[#e1601f] focus:ring-[#e1601f] block p-1.5 outline-none cursor-pointer hover:border-gray-300"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="hidden sm:inline ml-2 text-gray-400">|</span>
            <span className="hidden sm:inline ml-2">
                Showing {pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.per_page) + 1} - {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total}
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