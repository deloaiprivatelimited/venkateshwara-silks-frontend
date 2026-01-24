import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Image as ImageIcon,
  ArrowLeft,
  Plus,
  Edit2,
  X,
} from "lucide-react";
import api from "../api/axios";
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

interface PaginationState {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

const SareesByVariety: React.FC = () => {
  const THEME = {
    primary: "#e1601f",
  };

  const navigate = useNavigate();
  const { varietyName } = useParams<{ varietyName: string }>();
  const fixedVariety = decodeURIComponent(varietyName || "");

  const [sarees, setSarees] = useState<Saree[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 1,
  });

  // ----- Modal State -----
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSaree, setEditingSaree] = useState<Saree | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

const initialFormState = {
  image_urls: [] as string[],
  variety: fixedVariety,
  remarks: "",
  min_price: 0,
  max_price: 0,
  status: "published" as "published" | "unpublished",
};


  const [formData, setFormData] = useState(initialFormState);

  // ---- Fetch Sarees ----
  const fetchSarees = useCallback(async () => {
    if (!fixedVariety) return;

    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        per_page: pagination.per_page,
        variety: fixedVariety,
      };

      if (searchQuery.trim()) params.search = searchQuery;

      const res = await api.get("/sarees", { params });
      const data = res.data;

      setSarees(data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
        total_pages: Math.ceil((data.total || 0) / prev.per_page) || 1,
      }));
    } catch (err) {
      console.error("Failed to fetch sarees by variety", err);
      setSarees([]);
    } finally {
      setLoading(false);
    }
  }, [fixedVariety, searchQuery, pagination.page, pagination.per_page]);

  useEffect(() => {
    const timer = setTimeout(fetchSarees, 300);
    return () => clearTimeout(timer);
  }, [fetchSarees]);

  // ---- Pagination ----
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

  // ---- Add / Edit ----
  const openAddModal = () => {
    setEditingSaree(null);
    setFormData({
      ...initialFormState,
      variety: fixedVariety, // ✅ default variety
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Saree) => {
    setEditingSaree(s);
    setFormData({
      image_urls: s.image_urls || [],
      variety: fixedVariety, // ✅ lock to current variety
      remarks: s.remarks || "",
      min_price: s.min_price,
      max_price: s.max_price,
      status: s.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.image_urls.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        variety: fixedVariety, // ✅ ALWAYS force this variety
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
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to save saree");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-4 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/varieties")}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Sarees - {fixedVariety}
            </h1>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Manage sarees under this variety
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white transition-all duration-200 rounded-xl shadow-md hover:shadow-lg"
          style={{ backgroundColor: THEME.primary }}
        >
          <span className="relative flex items-center gap-2">
            <Plus size={18} /> Add Saree
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search
              size={18}
              className="text-gray-400 group-focus-within:text-[#e1601f] transition-colors"
            />
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
            style={{ "--tw-ring-color": THEME.primary } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-[#e1601f]" size={40} />
              <p className="text-gray-400 text-sm animate-pulse">Loading...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sarees.length ? (
                sarees.map((item) => (
                  <div
                    key={item.id}
                    className="group border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="w-full h-48 bg-gray-100 overflow-hidden relative">
                      {item.image_urls?.[0] ? (
                        <img
                          src={item.image_urls[0]}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ImageIcon size={40} />
                        </div>
                      )}

                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(item)}
                        className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 border border-gray-200 shadow-sm hover:bg-white text-gray-600 hover:text-[#e1601f] transition-all"
                        title="Edit Saree"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>

                    <div className="p-4 flex flex-col gap-2">
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#e1601f] transition-colors">
                        {item.name}
                      </h3>

                      <p className="text-xs text-gray-400 line-clamp-2">
                        {item.remarks || "No remarks"}
                      </p>

                      <div className="text-sm font-semibold text-gray-700">
                        ₹{item.min_price} - ₹{item.max_price}
                      </div>

                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border w-fit ${
                          item.status === "published"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <p className="text-base font-medium text-gray-500">
                    No sarees found in this variety
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
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
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:border-[#e1601f] hover:text-[#e1601f] bg-white text-gray-600 transition-all duration-200 shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>

            <div
              className="flex items-center justify-center h-9 min-w-[36px] px-3 rounded-lg text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: THEME.primary }}
            >
              {pagination.page}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
              className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:border-[#e1601f] hover:text-[#e1601f] bg-white text-gray-600 transition-all duration-200 shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal (Add/Edit Saree) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between mb-6 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingSaree ? "Edit Saree" : "Add New Saree"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Variety is fixed to: <span className="font-bold">{fixedVariety}</span>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors h-fit"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                

                  {/* Fixed Variety */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                      Variety
                    </label>
                    <input
                      value={fixedVariety}
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as "published" | "unpublished",
                        })
                      }
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
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                        Min Price
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.min_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            min_price: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#e1601f] focus:ring-1 focus:ring-[#e1601f] text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                        Max Price
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.max_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            max_price: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#e1601f] focus:ring-1 focus:ring-[#e1601f] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                      Remarks
                    </label>
                    <textarea
                      rows={4}
                      value={formData.remarks}
                      onChange={(e) =>
                        setFormData({ ...formData, remarks: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#e1601f] focus:ring-1 focus:ring-[#e1601f] text-sm resize-none"
                      placeholder="Any additional details..."
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <ImageUpload
                  initialUrls={formData.image_urls}
                  onChange={(urls) =>
                    setFormData({ ...formData, image_urls: urls })
                  }
                  path="/sarees"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium transition-colors text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl text-white font-medium flex justify-center gap-2 transition-colors text-sm shadow-md"
                  style={{ backgroundColor: THEME.primary }}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : editingSaree ? (
                    "Update Saree"
                  ) : (
                    "Create Saree"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SareesByVariety;
