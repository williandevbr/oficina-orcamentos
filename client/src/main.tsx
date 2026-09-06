import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// "Monta" o site na página, a partir do componente principal <App />
const raiz = document.getElementById("root");
if (!raiz) {
  throw new Error("Elemento #root não encontrado no index.html.");
}
ReactDOM.createRoot(raiz).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
