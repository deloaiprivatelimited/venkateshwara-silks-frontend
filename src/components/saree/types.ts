// src/components/saree/types.ts

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