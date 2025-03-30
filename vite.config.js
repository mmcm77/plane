import { defineConfig } from "vite";

export default defineConfig({
  base: "https://mmcm77.github.io/plane/",
  build: {
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
