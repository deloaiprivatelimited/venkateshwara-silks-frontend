import React, { useCallback,  useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { X, Camera, Upload, Check } from "lucide-react";
// import api from "../../api/axios";
import api from "../api/axios";
type Props = {
  onUploaded: (url: string) => void;
};

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

async function getCroppedBlob(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas not supported");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob as Blob), "image/jpeg", 0.92);
  });
}

export default function CameraCropUpload({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [isUploading, setIsUploading] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const pickFile = () => inputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const uploadCropped = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);

      const file = new File([blob], `saree_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      const form = new FormData();
      form.append("file", file);

      // ✅ BACKEND should return uploaded URL
      // Example response: { url: "https://..." }
      const res = await api.post("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.url;
      if (!url) throw new Error("Upload failed: url not found");

      onUploaded(url);
      setImageSrc(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={pickFile}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold"
        >
          <Upload size={16} />
          Upload / Gallery
        </button>

        <button
          type="button"
          onClick={pickFile}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ backgroundColor: "#e1601f" }}
        >
          <Camera size={16} />
          Camera
        </button>
      </div>

      {/* Crop Modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center px-5 py-4 border-b">
              <h3 className="font-bold text-gray-900">Crop Photo</h3>
              <button
                type="button"
                onClick={() => setImageSrc(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative w-full h-[420px] bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1} // ✅ square crop
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="px-5 py-4 border-t flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-semibold">
                  Zoom
                </span>
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
                onClick={uploadCropped}
                disabled={isUploading}
                className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#e1601f" }}
              >
                {isUploading ? (
                  "Uploading..."
                ) : (
                  <>
                    <Check size={18} /> Crop & Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
