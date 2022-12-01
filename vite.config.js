import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const resolvePath = (str) => resolve(__dirname, str);

export default defineConfig({
  build: {
    lib: {
      entry: resolvePath("src/index.ts"),
      name: "miniGPU",
      fileName: "minigpu",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["gl-matrix"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          "gl-matrix": "glMatrix",
        },
      },
      // plugins: [
      //   dts({
      //     skipDiagnostics: true,
      //   }),
      // ],
    },
  },
});
