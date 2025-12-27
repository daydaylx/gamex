import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [preact(), tailwindcss()],
  base: "./", // Important for Capacitor - relative paths
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    // Optimize for mobile
    target: "es2020",
    minify: "esbuild",
    sourcemap: false,
  },
  server: {
    port: 5173,
  },
});

