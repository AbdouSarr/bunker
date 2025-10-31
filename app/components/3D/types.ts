// components/3D/types.ts

import * as THREE from 'three';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  descriptionHtml: string;
  variants: {
    nodes: {
      id: string;
      title: string;
      price: {
        amount: string;
        currencyCode: string;
      };
      availableForSale: boolean;
    }[];
  };
  mdx_model: {
    reference: {
      url?: {value: string};
      scale?: {value: string}; // JSON string e.g. '{"x": 1, "y": 1, "z": 1}'
      position?: {value: string}; // JSON string
      rotation?: {value: string}; // JSON string
    } | null;
  } | null;
}

/**
 * The combined and processed data structure used by the 3D components.
 */
export interface ProductData {
  id: string;
  modelUrl: string;
  scale: Vector3;
  position: Vector3;
  rotation: Vector3 | undefined;
  shopifyProduct: ShopifyProduct; // Include the full Shopify product data
}

/**
 * Represents a selected product in the 3D scene, used for camera focus.
 */
export interface SelectedProduct {
  id: string;
  center: THREE.Vector3;
  radius: number;
}

// You can keep other types like Variant, OnAddDetails if needed by ProductCard
export interface Variant {
  id: string;
  size: string;
}

export interface OnAddDetails {
  productId: string;
  variantId?: string;
  quantity: number;
}
