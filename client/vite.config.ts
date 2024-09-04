/* eslint-disable import/no-extraneous-dependencies */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
// IMP START - Bundler Issues
export default defineConfig({
  plugins: [react()],
  build: {
    target: "ES2022",
  },
  resolve: {
    alias: {
      crypto: "empty-module",
    },
  },
  define: {
    global: "globalThis",
  },
  // IMP END - Bundler Issues
});
