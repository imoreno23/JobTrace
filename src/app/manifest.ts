import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JobTrace Contractor Workspace",
    short_name: "JobTrace",
    description: "Projects, customers, and job photos in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#f7f5ef",
    icons: [{ src: "/jobtrace-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
