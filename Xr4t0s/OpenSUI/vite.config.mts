import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/home/kratos/workSUI/Xr4t0s/OpenSUI/src", // à modifier
    },
  },
});
