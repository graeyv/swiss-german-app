import type { MetadataRoute } from "next";

// Lets learners add Hoi to their home screen and open it full screen, like an app. The icons are
// the logo's speech bubble on teal, drawn once with DM Sans (see DESIGN.md): the rounded one as
// it is, the maskable one with room around it for the shapes Android cuts icons into.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hoi – Learn Swiss German",
    short_name: "Hoi",
    description: "Short, practical modules in Swiss German.",
    start_url: "/",
    display: "standalone",
    // Ivory, the app's background, so opening it doesn't flash another colour.
    background_color: "#FAF9F6",
    theme_color: "#FAF9F6",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
