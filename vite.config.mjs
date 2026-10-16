import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
// `npm run dev` serves the gallery at /gallery/.
export default defineConfig({ plugins: [tailwindcss()] });
