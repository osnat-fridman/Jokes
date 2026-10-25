import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/ui/appInfo";

// PWA manifest (ARCHITECTURE.md 2.8, DESIGN.md "סמל האפליקציה").
// No service worker: installing works without offline support.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    lang: "he",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#F47FA8",
    background_color: "#FFFDFB",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // The face stays inside the maskable safe zone, so the same file works.
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
