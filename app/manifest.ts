import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Entrena — progreso con criterio",
    short_name: "Entrena",
    description:
      "Registra entrenamientos y recibe recomendaciones explicables.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f1ea",
    theme_color: "#f3f1ea",
    lang: "es",
  };
}
