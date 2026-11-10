import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fertig berechnete Bildvarianten bleiben 31 Tage im Zwischenspeicher (Standard wären 4 Stunden)
    minimumCacheTTL: 2678400,
    // Größte ausgelieferte Bildbreite 1280 px, die Fotos sind nie breiter als 1060 px zu sehen
    deviceSizes: [480, 640, 750, 828, 1080, 1280],
    imageSizes: [96, 128, 256, 384],
    qualities: [68],
  },
};

export default nextConfig;
