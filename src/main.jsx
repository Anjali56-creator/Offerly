import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { InternshipsProvider } from "./context/InternshipsContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <InternshipsProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </InternshipsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
