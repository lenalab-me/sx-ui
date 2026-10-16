// The Vite plugin an app adds next to Tailwind's: `plugins: [tailwindcss(), sxUi()]`.
import type { Plugin } from "vite";

// The parts are TSX source in node_modules, and so is their gallery page. Vite's esbuild does not
// read the tsconfig.json inside node_modules, so their JSX would be compiled with the classic
// runtime and fail with "React is not defined": this sets the automatic runtime for the files Vite
// serves and for the pre-bundled @sx/ui. The gallery is not found by Vite's first scan (the app's
// index.html is its only entry), so React is named for pre-bundling; otherwise the gallery would
// load a second, un-bundled copy of it.
export function sxUi(): Plugin {
  return {
    name: "sx-ui",
    config: () => ({
      esbuild: { jsx: "automatic" },
      optimizeDeps: {
        esbuildOptions: { jsx: "automatic" },
        include: [
          "react",
          "react-dom/client",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
        ],
      },
    }),
  };
}
