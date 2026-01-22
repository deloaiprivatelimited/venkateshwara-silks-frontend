import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpAZ,
  ArrowDownZA,
  ArrowDownUp,
  LayoutList,Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- Types ---
interface Category {
  id: string;
  name: string;
  total_saree_count: number;
}

interface PaginationState {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

type SortOrder = "asc" | "desc";
type SortField = "name" | "total_saree_count";

// --- Modal Props ---
interface CategoryModalProps {
  isOpen: boolean;
  editingCategory: Category | null;
  formData: { name: string };
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  editingCategory,
  formData,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-3">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {editingCategory ? "Edit Category" : "Add Category"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {editingCategory
              ? "Update category name"
              : "Create a new category for sarees"}
          </p>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Category Name
            </label>
            <input
              value={formData.name}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Eg: Wedding Silk, Fancy, Cotton..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1"
              style={
                {
                  ["--tw-ring-color" as any]: "#e1601f",
                } as React.CSSProperties
              }
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition"
              style={{ backgroundColor: "#e1601f" }}
            >
              {isSubmitting ? "Saving..." : editingCategory ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Page ---
const Categories: React.FC = () => {
      const navigate = useNavigate();   // ✅ add this line

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 1,
  });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const THEME = {
    primary: "#e1601f",
    primaryHover: "#c24e12",
  };

  const getAuthHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    "Content-Type": "application/json",
  });

  // ✅ Fetch Categories (You need backend GET route for categories list)
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: pagination.per_page.toString(),
        search: searchQuery,
        sort_by: sortBy,
        order: sortOrder,
      });

      const res = await fetch(`${API_BASE}/admin/categories?${params}`, {
        headers: getAuthHeader(),
      });

      const data = await res.json();

      if (res.ok) {
        setCategories(data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: data.total || 0,
          total_pages:
            data.total_pages || Math.ceil((data.total || 0) / prev.per_page) || 1,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchCategories, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, pagination.page, pagination.per_page, sortBy, sortOrder]);

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

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const endpoint = editingCategory
        ? `/admin/category/${editingCategory.id}`
        : `/admin/category`;

      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: getAuthHeader(),
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCategories();
      }
    } catch (err) {
      console.error("Failed to save category", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const start =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.per_page + 1;
  const end = Math.min(pagination.page * pagination.per_page, pagination.total);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 p-2 sm:p-4">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Categories
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize sarees into perfect groups
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="group inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white transition-all duration-200 rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ backgroundColor: THEME.primary }}
        >
          <span className="relative flex items-center gap-2">
            <Plus size={18} />
            Add Category
          </span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
        {/* Search */}
        <div className="relative w-full md:flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search
              size={18}
              className="text-gray-400 group-focus-within:text-[#e1601f] transition-colors"
            />
          </div>

          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            placeholder="Search categories..."
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 transition-all duration-200 sm:text-sm"
            style={
              {
                ["--tw-ring-color" as any]: THEME.primary,
              } as React.CSSProperties
            }
          />
        </div>

        <hr className="md:hidden border-gray-100" />

        {/* Sorting */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LayoutList size={16} className="text-gray-400" />
            </div>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortField);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="block w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg cursor-pointer bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 transition-colors appearance-none text-gray-700 font-medium"
              style={
                {
                  ["--tw-ring-color" as any]: THEME.primary,
                } as React.CSSProperties
              }
            >
              <option value="name">Name</option>
              <option value="total_saree_count">Total Count</option>
            </select>

            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <ArrowDownUp size={14} className="text-gray-400" />
            </div>
          </div>

          <button
            onClick={toggleSortOrder}
            className="flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-1 transition-all duration-200 bg-white"
            style={
              {
                ["--tw-ring-color" as any]: THEME.primary,
              } as React.CSSProperties
            }
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
          >
            {sortOrder === "asc" ? (
              <ArrowUpAZ size={20} className="text-gray-600" />
            ) : (
              <ArrowDownZA size={20} className="text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-auto relative">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-[#e1601f]" size={40} />
              <p className="text-gray-400 text-sm animate-pulse">
                Loading categories...
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total Count
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {categories.length ? (
                  categories.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-[#e1601f]/[0.02] transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800 text-sm group-hover:text-[#e1601f] transition-colors">
                          {c.name}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
                          style={{
                            backgroundColor: "rgba(225, 96, 31, 0.08)",
                            color: THEME.primary,
                            borderColor: "rgba(225, 96, 31, 0.2)",
                          }}
                        >
                          {c.total_saree_count} Items
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                       <button
  onClick={() => navigate(`/admin/categories/${c.id}/builder`)}
  className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all duration-200"
  onMouseEnter={(e) => (e.currentTarget.style.color = "#e1601f")}
  onMouseLeave={(e) => (e.currentTarget.style.color = "")}
>
  <Eye size={18} />
</button>

                        <button
                          onClick={() => openEditModal(c)}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all duration-200"
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = THEME.primary)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "")
                          }
                        >
                          <Edit2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p className="text-base font-medium text-gray-500">
                          No categories found
                        </p>
                        <p className="text-sm mt-1">
                          Try adjusting your search or filters.
                        </p>
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

            <span className="ml-2 text-gray-400">|</span>

            <span className="ml-2">
              Showing{" "}
              <span className="font-bold text-gray-800">{start}</span> -{" "}
              <span className="font-bold text-gray-800">{end}</span> of{" "}
              <span className="font-bold text-gray-800">
                {pagination.total}
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

      {/* Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        editingCategory={editingCategory}
        formData={formData}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onChange={(value) => setFormData({ name: value })}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default Categories;
