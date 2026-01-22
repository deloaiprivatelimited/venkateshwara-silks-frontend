import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Loader2,
  Pencil,
  Save,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
/** -----------------------------
 * Types
 ------------------------------*/
interface Saree {
  id: string;
  name: string;
  image_urls: string[];
  variety?: string;
  remarks?: string;
  min_price: number;
  max_price: number;
  status: "published" | "unpublished";
  last_edited_at: string;
}

interface CategoryDetails {
  id: string;
  name: string;
  saree_ids: string[];
}

interface PickerResponse {
  category_id?: string;
  category_name?: string;
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  selected_count: number;
  data: Saree[];
}

interface PaginationState {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/** -----------------------------
 * Saree Card
 ------------------------------*/
const SareeCard: React.FC<{
  saree: Saree;
  selected: boolean;
  selectionEnabled: boolean;
  onToggle: (id: string) => void;
}> = ({ saree, selected, selectionEnabled, onToggle }) => {
  const cover =
    saree.image_urls?.[0] ||
    "https://via.placeholder.com/400x500?text=No+Image";

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition">
      <div className="relative">
        <img
          src={cover}
          alt={saree.name}
          className="w-full h-52 object-cover bg-gray-50"
          loading="lazy"
        />

        {/* Selected badge */}
     {selected && (
  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-black/60 backdrop-blur-sm">
    ✓ Added
  </div>
)}



        {/* Toggle select */}
    <button
  disabled={!selectionEnabled}
  onClick={() => onToggle(saree.id)}
  className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition
    ${selectionEnabled ? "cursor-pointer" : " cursor-not-allowed"}
    ${selected ? "bg-white" : selectionEnabled?"bg-black backdrop-blur-sm":"bg-black/40 backdrop-blur-sm"}`}
>
  {selected ? (
    <Check size={18} className="text-[#e1601f]" />
  ) : (
    <div className="w-5 h-5 rounded-full border-2 border-white/90" />
  )}
</button>


      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
            {saree.name}
          </h3>

          <span
            className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border"
            style={{
              backgroundColor:
                saree.status === "published"
                  ? "rgba(16,185,129,0.08)"
                  : "rgba(107,114,128,0.08)",
              borderColor:
                saree.status === "published"
                  ? "rgba(16,185,129,0.18)"
                  : "rgba(107,114,128,0.18)",
              color: saree.status === "published" ? "#059669" : "#6b7280",
            }}
          >
            {saree.status}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold text-gray-700">
            ₹{saree.min_price} - ₹{saree.max_price}
          </span>
          <span className="text-gray-400">{saree.variety || "—"}</span>
        </div>

        {saree.remarks ? (
          <p className="text-xs text-gray-500 line-clamp-2">{saree.remarks}</p>
        ) : (
          <p className="text-xs text-gray-300 italic">No remarks</p>
        )}
      </div>
    </div>
  );
};

/** -----------------------------
 * CATEGORY BUILDER PAGE
 * Route: /admin/categories/:categoryId/builder
 ------------------------------*/
const CategoryBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();


  const THEME = {
    primary: "#e1601f",
    primaryHover: "#c24e12",
  };

  

  const [category, setCategory] = useState<CategoryDetails | null>(null);

  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingPicker, setLoadingPicker] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [variety, setVariety] = useState("");

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    per_page: 12,
    total: 0,
    total_pages: 1,
  });

  const [sarees, setSarees] = useState<Saree[]>([]);

  // Selected saree IDs for this category
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /** --------------------------------
   * Fetch Category Details (name + saree_ids)
   * Backend route:
   * GET /admin/category/<id>
   ----------------------------------*/
 const fetchCategoryDetails = async () => {
  if (!categoryId) return;
  setLoadingCategory(true);

  try {
    const res = await api.get(`/admin/category/${categoryId}`);

    const data = res.data;
    const sareeIds = data.saree_ids || [];

    setCategory({
      id: data.id,
      name: data.name,
      saree_ids: sareeIds,
    });

    setSelectedIds(sareeIds);
  } catch (e) {
    console.error("Failed to fetch category details", e);
  } finally {
    setLoadingCategory(false);
  }
};


  /** --------------------------------
   * Fetch Saree Picker (selected first)
   * Backend route (UPDATED):
   * GET /admin/category/<category_id>/sarees/picker
   * Query params: search, variety, page, per_page
   ----------------------------------*/
 const fetchPickerSarees = async () => {
  if (!categoryId) return;
  setLoadingPicker(true);

  try {
    const res = await api.get(`/admin/category/${categoryId}/sarees/picker`, {
      params: {
        search: search || undefined,
        variety: variety || undefined,
        page: pagination.page,
        per_page: pagination.per_page,
      },
    });

    const data: PickerResponse = res.data;

    setSarees(data.data || []);
    setPagination((prev) => ({
      ...prev,
      total: data.total || 0,
      total_pages: data.total_pages || 1,
    }));
  } catch (e) {
    console.error("Failed to fetch picker sarees", e);
  } finally {
    setLoadingPicker(false);
  }
};


  useEffect(() => {
    fetchCategoryDetails();
  }, [categoryId]);

  // Picker fetch (debounced) - no need selectedIds dependency now
  useEffect(() => {
    const t = setTimeout(fetchPickerSarees, 250);
    return () => clearTimeout(t);
  }, [search, variety, pagination.page, pagination.per_page, categoryId]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.total_pages) return;
    setPagination((prev) => ({ ...prev, page }));
  };

  const toggleSelect = (id: string) => {
    if (!isEditMode) return;

    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  /** --------------------------------
   * Save Category Sarees
   * Backend route:
   * PUT /admin/category/<category_id>/sarees
   * body: { saree_ids: [...] }
   ----------------------------------*/
const saveSelection = async () => {
  if (!categoryId) return;
  setIsSaving(true);

  try {
    const res = await api.put(`/admin/category/${categoryId}/sarees`, {
      saree_ids: selectedIds,
    });

    setIsEditMode(false);

    setCategory((prev) =>
      prev ? { ...prev, saree_ids: [...selectedIds] } : prev
    );

    console.log("Saved:", res.data);
  } catch (e) {
    console.error("Failed to save category sarees", e);
  } finally {
    setIsSaving(false);
  }
};


  const headerTitle = useMemo(() => {
    if (loadingCategory) return "Category Builder";
    if (!category) return "Category Builder";
    return category.name;
  }, [category, loadingCategory]);

  const start =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.per_page + 1;

  const end = Math.min(pagination.page * pagination.per_page, pagination.total);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-4 p-2 sm:p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Header */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {headerTitle}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Select sarees to include in this category (selected shown first)
            </p>
          </div>
        </div>

        {/* Edit / Save */}
        <div className="flex items-center gap-2">
          {!isEditMode ? (
            <button
              onClick={() => setIsEditMode(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-200 bg-white hover:bg-gray-50 transition shadow-sm"
            >
              <Pencil size={16} className="text-gray-700" />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  // cancel changes => reset selectedIds to DB state
                  setSelectedIds(category?.saree_ids || []);
                  setIsEditMode(false);
                }}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-200 bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-60"
              >
                <X size={16} className="text-gray-700" />
                Cancel
              </button>

              <button
                onClick={saveSelection}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition"
                style={{ backgroundColor: THEME.primary }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex-shrink-0 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search
              size={18}
              className="text-gray-400 group-focus-within:text-[#e1601f] transition-colors"
            />
          </div>

          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            placeholder="Search sarees by name..."
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 transition-all duration-200 sm:text-sm"
            style={
              {
                ["--tw-ring-color" as any]: THEME.primary,
              } as React.CSSProperties
            }
          />
        </div>

        <div className="w-full md:w-56">
          <input
            value={variety}
            onChange={(e) => {
              setVariety(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            placeholder="Filter by variety..."
            className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 transition sm:text-sm"
            style={
              {
                ["--tw-ring-color" as any]: THEME.primary,
              } as React.CSSProperties
            }
          />
        </div>

        <div className="w-full md:w-44">
          <select
            value={pagination.per_page}
            onChange={(e) =>
              setPagination((p) => ({
                ...p,
                per_page: Number(e.target.value),
                page: 1,
              }))
            }
            className="block w-full px-4 py--2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 transition sm:text-sm cursor-pointer"
            style={
              {
                ["--tw-ring-color" as any]: THEME.primary,
              } as React.CSSProperties
            }
          >
            <option value={8}>8 / page</option>
            <option value={12}>12 / page</option>
            <option value={16}>16 / page</option>
            <option value={24}>24 / page</option>
          </select>
        </div>
      </div>

      {/* Saree Grid */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          {loadingPicker ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-[#e1601f]" size={40} />
              <p className="text-gray-400 text-sm animate-pulse">
                Loading sarees...
              </p>
            </div>
          ) : sarees.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sarees.map((s) => (
                <SareeCard
                  key={s.id}
                  saree={s}
                  selected={selectedIds.includes(s.id)}
                  selectionEnabled={isEditMode}
                  onToggle={toggleSelect}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-base font-medium text-gray-500">
                No sarees found
              </p>
              <p className="text-sm mt-1">Try changing search or variety</p>
            </div>
          )}
        </div>

        {/* Footer Pagination */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
          <div className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-bold text-gray-800">{start}</span> -{" "}
            <span className="font-bold text-gray-800">{end}</span> of{" "}
            <span className="font-bold text-gray-800">{pagination.total}</span>
            <span className="ml-2 text-gray-400">|</span>
            <span className="ml-2">
              Selected:{" "}
              <span className="font-bold text-gray-800">
                {selectedIds.length}
              </span>
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

      {/* Edit mode hint */}
      <div className="text-xs text-gray-400 flex items-center justify-between px-1">
        <span>
          {isEditMode
            ? "Edit mode enabled: click ✅ or ❌ on top-right of a saree card to select/deselect."
            : "Click Edit to enable selecting sarees."}
        </span>
        <span className="font-semibold" style={{ color: THEME.primary }}>
          Selected appear first
        </span>
      </div>
    </div>
  );
};

export default CategoryBuilder;
