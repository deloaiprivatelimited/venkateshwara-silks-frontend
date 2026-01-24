import React, { useState, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import { CloudUpload, X, Loader2, RefreshCw, GripVertical, Camera } from "lucide-react";
import { uploadFile } from "../../lib/storage";

interface ImageItem {
  id: string;
  file?: File;
  url?: string;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

interface ImageUploadProps {
  initialUrls?: string[];
  onChange?: (urls: string[]) => void;
  path?: string;
}

/* ----------------------------------
   Crop Helpers
---------------------------------- */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function getCroppedBlob(imageSrc: string, cropPixels: any): Promise<Blob> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob as Blob), "image/jpeg", 0.95);
  });
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  initialUrls = [],
  onChange,
  path = "/sarees",
}) => {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Camera input
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Drag & drop sort refs
  const dragItemIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  // Prevent infinite onChange loops
  const lastEmittedUrlsRef = useRef<string>("");

  /* ----------------------------------
     Crop Modal State
  ---------------------------------- */
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  /* ----------------------------------
     Initialize existing images
  ---------------------------------- */
  useEffect(() => {
    if (initialUrls.length && items.length === 0) {
      const mapped = initialUrls.map((url) => ({
        id: crypto.randomUUID(),
        url,
        preview: url,
        progress: 100,
        status: "completed" as const,
      }));

      setItems(mapped);
      lastEmittedUrlsRef.current = JSON.stringify(initialUrls);
    }
  }, [initialUrls, items.length]);

  /* ----------------------------------
     Emit changes safely
  ---------------------------------- */
  useEffect(() => {
    if (!onChange) return;

    const urls = items
      .filter((i) => i.status === "completed" && i.url)
      .map((i) => i.url!);

    const fingerprint = JSON.stringify(urls);

    if (fingerprint !== lastEmittedUrlsRef.current) {
      lastEmittedUrlsRef.current = fingerprint;
      onChange(urls);
    }
  }, [items, onChange]);

  /* ----------------------------------
     Upload Logic
  ---------------------------------- */
  const updateItem = (id: string, data: Partial<ImageItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  };

  const uploadImage = async (item: ImageItem) => {
    if (!item.file) return;

    updateItem(item.id, { status: "uploading", progress: 0 });

    try {
      const url = await uploadFile(
        item.file,
        (p) => updateItem(item.id, { status: "uploading", progress: p }),
        path
      );

      updateItem(item.id, {
        status: "completed",
        progress: 100,
        url,
      });
    } catch (err: any) {
      updateItem(item.id, {
        status: "error",
        progress: 0,
        error: err?.message || "Upload failed",
      });
    }
  };

  const processFiles = (files: File[]) => {
    const newItems: ImageItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: "pending",
    }));

    setItems((prev) => [...prev, ...newItems]);
    newItems.forEach(uploadImage);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  /* ----------------------------------
     Drag & Drop sorting
  ---------------------------------- */
  const onDragStart = (index: number) => {
    dragItemIndex.current = index;
  };

  const onDragEnter = (index: number) => {
    dragOverIndex.current = index;
  };

  const onDragEnd = () => {
    const from = dragItemIndex.current;
    const to = dragOverIndex.current;

    if (from === null || to === null || from === to) return;

    setItems((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });

    dragItemIndex.current = null;
    dragOverIndex.current = null;
  };

  /* ----------------------------------
     Open crop modal from a selected file
  ---------------------------------- */
  const openCropFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ----------------------------------
     Render
  ---------------------------------- */
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Saree Images</h3>
      <p className="text-sm text-gray-500 mb-4">
        Upload and arrange images. First image will be the cover.
      </p>

      {/* ✅ Upload + Camera Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold"
        >
          Upload / Gallery
        </button>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="px-4 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700 text-sm font-semibold flex items-center gap-2"
        >
          <Camera size={16} />
          Camera
        </button>

        {/* hidden input (gallery) */}
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*"
          onChange={(e) => {
            if (!e.target.files?.length) return;
            openCropFromFile(e.target.files[0]);
            e.target.value = "";
          }}
        />

        {/* hidden input (camera) */}
        <input
          ref={cameraInputRef}
          type="file"
          hidden
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            if (!e.target.files?.length) return;
            openCropFromFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>

      {/* Drop zone (multi upload) */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
          isDraggingOver
            ? "border-orange-400 bg-orange-50"
            : "border-gray-200 hover:bg-gray-50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setIsDraggingOver(false);
          processFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-sm font-medium">
          Drag & drop files here (multi upload supported)
        </p>
      </div>

      {/* Gallery */}
      {items.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragEnter={() => onDragEnter(index)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="relative aspect-square rounded-xl overflow-hidden border bg-gray-100 group"
            >
              <img src={item.preview} className="w-full h-full object-cover" alt="" />

              <div className="absolute top-2 left-2 bg-black/30 p-1 rounded opacity-0 group-hover:opacity-100">
                <GripVertical size={14} className="text-white" />
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="absolute top-2 right-2 bg-white p-1 rounded shadow opacity-0 group-hover:opacity-100"
              >
                <X size={14} />
              </button>

              {item.status === "uploading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70">
                  <Loader2 className="animate-spin text-orange-600 mb-2" />
                  <span className="text-xs">{item.progress}%</span>
                </div>
              )}

              {item.status === "error" && (
                <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
                  <button
                    onClick={() => uploadImage(item)}
                    className="text-xs text-red-600 flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ✅ Crop Modal */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center px-5 py-4 border-b">
              <h3 className="font-bold text-gray-900">Crop Image</h3>
              <button
                type="button"
                onClick={() => setCropImageSrc(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative w-full h-[420px] bg-black">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1} // ✅ square crop
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedPixels(pixels)}
              />
            </div>

            <div className="p-5 border-t flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <button
                type="button"
                disabled={isCropping}
                className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                onClick={async () => {
                  if (!croppedPixels) return;

                  setIsCropping(true);
                  try {
                    const blob = await getCroppedBlob(cropImageSrc, croppedPixels);

                    const croppedFile = new File([blob], `crop_${Date.now()}.jpg`, {
                      type: "image/jpeg",
                    });

                    processFiles([croppedFile]);

                    setCropImageSrc(null);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                    setCroppedPixels(null);
                  } catch (err) {
                    alert("Cropping failed");
                  } finally {
                    setIsCropping(false);
                  }
                }}
              >
                {isCropping ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Cropping...
                  </>
                ) : (
                  "Crop & Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
