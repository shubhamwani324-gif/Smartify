// SMARTIFY Client-side Centralized Product Image Mapping & Category Fallbacks

export const PRODUCT_IMAGE_REGISTRY = {
  "p-01": "/products/p-01.jpg",
  "p-02": "/products/p-02.jpg",
  "p-03": "/products/p-03.jpg",
  "p-04": "/products/p-04.jpg",
  "p-05": "/products/p-05.jpg",
  "p-06": "/products/p-06.jpg",
  "p-07": "/products/p-07.jpg",
  "p-08": "/products/p-08.jpg",
  "p-09": "/products/p-09.jpg",
  "p-10": "/products/p-10.jpg",
  "p-11": "/products/p-11.jpg",
  "p-12": "/products/p-12.jpg",
  "p-13": "/products/p-13.jpg",
  "p-14": "/products/p-14.png",
  "p-15": "/products/p-15.png",
  "p-16": "/products/p-16.webp",
  "p-17": "/products/p-17.png",
  "p-18": "/products/p-18.png",
  "p-19": "/products/p-19.png",
  "p-20": "/products/p-20.jpg",
  "p-21": "/products/p-21.svg",
  "p-22": "/products/p-22.png",
  "p-23": "/products/p-23.png",
  "p-24": "/products/p-24.jpg",
  "p-25": "/products/p-25.jpg",
  "p-26": "/products/p-26.jpg",
  "p-27": "/products/p-27.jpg",
  "p-28": "/products/p-28.svg",
  "p-29": "/products/p-29.svg",
  "p-30": "/products/p-30.svg",
  "p-31": "/products/p-31.svg"
};

export const CATEGORY_FALLBACK_ICONS = {
  "smart-lighting": { icon: "💡", label: "Smart Lighting", bg: "#fef3c7", color: "#d97706" },
  "smart-plugs": { icon: "🔌", label: "Smart Plug", bg: "#dbeafe", color: "#2563eb" },
  "home-security": { icon: "📷", label: "Home Security", bg: "#e0e7ff", color: "#4f46e5" },
  "smart-locks": { icon: "🔐", label: "Smart Lock", bg: "#fce7f3", color: "#db2777" },
  "smart-sensors": { icon: "🌡️", label: "Smart Sensor", bg: "#ecfdf5", color: "#059669" },
  "smart-control": { icon: "🎛️", label: "Smart Control", bg: "#f3e8ff", color: "#7c3aed" },
  "smart-entertainment": { icon: "🔊", label: "Smart Audio & TV", bg: "#ffedd5", color: "#ea580c" },
  "smart-home-combos": { icon: "🏠", label: "Smart Combo Kit", bg: "#d1fae5", color: "#047857" }
};

export function resolveProductImage(productId, currentUrl) {
  // If currentUrl is valid and not an unrelated Unsplash stock URL, return it
  if (PRODUCT_IMAGE_REGISTRY[productId]) {
    return PRODUCT_IMAGE_REGISTRY[productId];
  }
  return currentUrl || null;
}
