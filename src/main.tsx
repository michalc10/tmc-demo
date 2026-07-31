import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./global.css";
import "./site.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Nie znaleziono elementu aplikacji.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
