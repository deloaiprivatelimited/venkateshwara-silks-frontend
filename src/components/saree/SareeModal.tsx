import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Loader2, 
  Search, 
  ChevronDown, 
  Check 
} from "lucide-react";
import ImageUpload from "./ImageUpload"; // Adjust path if ImageUpload is in a different folder relative to this file

// --- Shared Types ---
export interface Saree {
  id: string;
  name: string;
  image_urls: string[];
  variety: string;
  remarks: string;
  min_price: number;
  max_price: number;
  status: "published" | "unpublished";
}

export interface VarietyOption {
  id: string;
  name: string;
}

export interface SareeFormData {
  name: string;
  image_urls: string[];
  variety: string;
  remarks: string;
  min_price: number;
  max_price: number;
  status: "published" | "unpublished";
}

// --- Internal Component: Searchable Select ---
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

// --- Modal Component ---
interface SareeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SareeFormData) => Promise<void>;
  initialData: Saree | null;
  varieties: VarietyOption[];
  loadingVarieties: boolean;
}

const SareeModal: React.FC<SareeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  varieties, 
  loadingVarieties 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialFormState: SareeFormData = {
    name: "",
    image_urls: [],
    variety: "",
    remarks: "",
    min_price: 0,
    max_price: 0,
    status: "published"
  };

  const [formData, setFormData] = useState<SareeFormData>(initialFormState);

  // Load initial data when modal opens or editing item changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          image_urls: initialData.image_urls || [],
          variety: initialData.variety,
          remarks: initialData.remarks || "",
          min_price: initialData.min_price,
          max_price: initialData.max_price,
          status: initialData.status
        });
      } else {
        setFormData(initialFormState);
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.image_urls.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <div className="flex justify-between mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? "Edit Saree" : "Add New Saree"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-orange-500 text-sm"
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
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-gray-900 text-white hover:bg-gray-800 font-medium flex justify-center gap-2 transition-colors">
              {isSubmitting ? <Loader2 className="animate-spin" /> : (initialData ? "Update Saree" : "Create Saree")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SareeModal;