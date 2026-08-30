import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Configuração do Vite (a ferramenta que monta o site)
export default defineConfig({
  plugins: [
    react(), // entende arquivos JSX (React)
    tailwindcss(), // aplica o Tailwind (visual/cores)
  ],
  server: {
    host: true, // permite abrir o site por outros aparelhos na mesma rede
    port: 5173, // porta padrão de desenvolvimento
    proxy: {
      // "Ponte": quando o site pedir algo em /api/...,
      // o Vite repassa o pedido para o nosso servidor (roda na porta 3333)
      "/api": "http://localhost:3333",
    },
  },
});
