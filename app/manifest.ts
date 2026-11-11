import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pentru tine",
    short_name: "Pentru tine",
    description: "Un buchet de flori, doar pentru tine.",
    start_url: "/",
    display: "fullscreen",
    display_override: ["fullscreen", "standalone"],
    orientation: "portrait",
    background_color: "#12071a",
    theme_color: "#12071a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
