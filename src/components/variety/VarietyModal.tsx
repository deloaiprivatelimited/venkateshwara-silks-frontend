import React from "react";
import { X, Loader2 } from "lucide-react";

// --- Types ---
interface Variety {
  id: string;
  name: string;
  total_saree_count: number;
}

interface VarietyModalProps {
  isOpen: boolean;
  editingVariety: Variety | null;
  formData: { name: string };
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const VarietyModal: React.FC<VarietyModalProps> = ({
  isOpen,
  editingVariety,
  formData,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            {editingVariety ? "Edit Variety" : "Add New Variety"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variety Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                placeholder="e.g. Kanjeevaram Silk"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-400 font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                editingVariety ? "Update Variety" : "Create Variety"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
