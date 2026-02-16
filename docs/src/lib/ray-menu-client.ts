// Client-only ray-menu loader
// This file is only imported dynamically from useEffect (client-side only)
export async function createRayMenu() {
  await import("ray-menu");
  return document.createElement("ray-menu") as any;
}
