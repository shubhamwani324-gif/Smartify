// server/productImageRegistry.js
// SMARTIFY Centralized Product-to-Image Mapping Registry
// Maps every product ID / SKU to its verified, locally-hosted product asset

const PRODUCT_IMAGE_REGISTRY = {
  "p-01": {
    image_url: "/products/p-01.jpg",
    gallery: ["/products/p-01.jpg"],
    alt: "Philips Wiz Smart Wi-Fi 9W LED Bulb B22 with 16 Million Colors"
  },
  "p-02": {
    image_url: "/products/p-02.jpg",
    gallery: ["/products/p-02.jpg"],
    alt: "Wipro Garnet 9W Smart LED Bulb B22 with Music Sync"
  },
  "p-03": {
    image_url: "/products/p-03.jpg",
    gallery: ["/products/p-03.jpg"],
    alt: "TP-Link Tapo L530E Smart Wi-Fi Multicolor LED Bulb B22"
  },
  "p-04": {
    image_url: "/products/p-04.jpg",
    gallery: ["/products/p-04.jpg"],
    alt: "Syska Smart LED 12W High-Brightness RGB+W Bulb B22"
  },
  "p-05": {
    image_url: "/products/p-05.jpg",
    gallery: ["/products/p-05.jpg"],
    alt: "TP-Link Tapo L900-5 Smart Wi-Fi LED Light Strip 5 Meters"
  },
  "p-06": {
    image_url: "/products/p-06.jpg",
    gallery: ["/products/p-06.jpg"],
    alt: "Xiaomi Smart LED Desk Lamp 1S with Ra90 Color Rendering"
  },
  "p-07": {
    image_url: "/products/p-07.jpg",
    gallery: ["/products/p-07.jpg"],
    alt: "TP-Link Tapo P110 Mini Smart Wi-Fi Plug with Energy Monitoring 16A"
  },
  "p-08": {
    image_url: "/products/p-08.jpg",
    gallery: ["/products/p-08.jpg"],
    alt: "Wipro 16A Smart Plug with Energy Monitoring for Heavy Appliances"
  },
  "p-09": {
    image_url: "/products/p-09.jpg",
    gallery: ["/products/p-09.jpg"],
    alt: "TP-Link Tapo P100 Mini Smart Wi-Fi Plug 10A Compact"
  },
  "p-10": {
    image_url: "/products/p-10.jpg",
    gallery: ["/products/p-10.jpg"],
    alt: "Portronics Konnect Smart Plug 10A Budget Friendly"
  },
  "p-11": {
    image_url: "/products/p-11.jpg",
    gallery: ["/products/p-11.jpg"],
    alt: "Qubo Smart Plug 16A with Indian Surge Protection"
  },
  "p-12": {
    image_url: "/products/p-12.jpg",
    gallery: ["/products/p-12.jpg"],
    alt: "TP-Link Tapo C200 Pan/Tilt Home Security Wi-Fi Camera 360 Degree View"
  },
  "p-13": {
    image_url: "/products/p-13.jpg",
    gallery: ["/products/p-13.jpg"],
    alt: "Qubo Smart 360 Cam 1080p AI Camera Made in India"
  },
  "p-14": {
    image_url: "/products/p-14.png",
    gallery: ["/products/p-14.png"],
    alt: "TP-Link Tapo C310 Outdoor Security Wi-Fi Camera IP66 Weatherproof 3MP"
  },
  "p-15": {
    image_url: "/products/p-15.png",
    gallery: ["/products/p-15.png"],
    alt: "Qubo Smart Wi-Fi Video Doorbell with Wireless Chime 1080p"
  },
  "p-16": {
    image_url: "/products/p-16.webp",
    gallery: ["/products/p-16.webp"],
    alt: "Godrej Advantis Smart Electronic Rim Door Lock with RFID and PIN"
  },
  "p-17": {
    image_url: "/products/p-17.png",
    gallery: ["/products/p-17.png"],
    alt: "Yale YDME 50 Pro Smart Digital Door Lock with Biometric Fingerprint"
  },
  "p-18": {
    image_url: "/products/p-18.png",
    gallery: ["/products/p-18.png"],
    alt: "TP-Link Tapo T110 Smart Contact Sensor for Door and Window"
  },
  "p-19": {
    image_url: "/products/p-19.png",
    gallery: ["/products/p-19.png"],
    alt: "TP-Link Tapo T100 Smart PIR Motion Sensor 120 Degree Wide Angle"
  },
  "p-20": {
    image_url: "/products/p-20.jpg",
    gallery: ["/products/p-20.jpg"],
    alt: "Xiaomi Smart Temperature and Humidity Monitor 2"
  },
  "p-21": {
    image_url: "/products/p-21.svg",
    gallery: ["/products/p-21.svg"],
    alt: "Qubo Smart Smoke Detector with 85dB Siren and Mobile Alerts"
  },
  "p-22": {
    image_url: "/products/p-22.png",
    gallery: ["/products/p-22.png"],
    alt: "Oakter WiFi Smart Universal Remote IR Blaster for TV and AC"
  },
  "p-23": {
    image_url: "/products/p-23.png",
    gallery: ["/products/p-23.png"],
    alt: "TP-Link Tapo H100 Smart IoT Hub with 90dB Built-in Chime"
  },
  "p-24": {
    image_url: "/products/p-24.jpg",
    gallery: ["/products/p-24.jpg"],
    alt: "Wipro Smart 4-Gang Touch Switch Board with Wi-Fi Modular Fit"
  },
  "p-25": {
    image_url: "/products/p-25.jpg",
    gallery: ["/products/p-25.jpg"],
    alt: "Amazon Echo Dot 5th Gen Smart Speaker with Alexa"
  },
  "p-26": {
    image_url: "/products/p-26.jpg",
    gallery: ["/products/p-26.jpg"],
    alt: "Google Nest Mini 2nd Gen Smart Speaker with Google Assistant"
  },
  "p-27": {
    image_url: "/products/p-27.jpg",
    gallery: ["/products/p-27.jpg"],
    alt: "realme Smart TV Stick 4K Google TV with Voice Remote"
  },
  "p-28": {
    image_url: "/products/p-28.svg",
    gallery: ["/products/p-28.svg"],
    alt: "Gharva Smart Starter Kit 3-in-1 Bulb, 10A Plug and IR Blaster"
  },
  "p-29": {
    image_url: "/products/p-29.svg",
    gallery: ["/products/p-29.svg"],
    alt: "Gharva 360 Home Security Kit Camera, 2x Door Sensors and Chime Hub"
  },
  "p-30": {
    image_url: "/products/p-30.svg",
    gallery: ["/products/p-30.svg"],
    alt: "Gharva Energy Saving Kit 2x 16A Plugs and 1x 9W Smart LED Bulb"
  },
  "p-31": {
    image_url: "/products/p-31.svg",
    gallery: ["/products/p-31.svg"],
    alt: "Gharva Color Ambiance Kit 5m Light Strip and 2x Tapo Color Bulbs"
  }
};

function getProductImage(productId) {
  return PRODUCT_IMAGE_REGISTRY[productId] || null;
}

module.exports = {
  PRODUCT_IMAGE_REGISTRY,
  getProductImage
};
