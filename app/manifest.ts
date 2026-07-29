import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Max Level — alcanza tu máximo nivel",
    short_name: "Max Level",
    description:
      "Registra entrenamientos y alcanza tu máximo nivel.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f1ea",
    theme_color: "#f3f1ea",
    lang: "es",
    icons: [
      {
        src: "/max-level-logo.png",
        sizes: "791x759",
        type: "image/png",
      },
    ],
  };
}
