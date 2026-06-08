// src/main.tsx  ← REEMPLAZA tu main.tsx actual
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import App from "./app/App";
// If TypeScript complains about missing type declarations for CSS imports,
// silence the error for this side-effect import.
// @ts-ignore
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
