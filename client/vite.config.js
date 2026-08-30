import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Configuração do Vite (a ferramenta que monta o site)
// plugins = "extensões" que adicionam funções ao Vite
export default defineConfig({
  plugins: [
    react(), // entende arquivos JSX (React)
    tailwindcss(), // aplica o Tailwind (visual/cores)
  ],
  server: {
    host: true, // permite abrir o site por outros aparelhos na mesma rede
    port: 5173, // porta padrão de desenvolvimento
  },
});
