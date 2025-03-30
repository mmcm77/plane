export default {
  root: "./",
  publicDir: "public",
  server: {
    host: true,
  },
  base: "/plane/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          vendor: ["howler"],
        },
      },
    },
  },
  resolve: {
    alias: {
      three: "three",
    },
  },
  optimizeDeps: {
    include: ["three", "three/examples/jsm/controls/OrbitControls.js"],
  },
};
