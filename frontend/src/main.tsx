import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import App from "./App";
import AppProviders from "@/providers/AppProviders";
import "./index.css";
import i18n, { applyLangDir } from "@/lib/i18n";

// Apply dir/lang on boot from persisted language
applyLangDir(i18n.language || 'en');
i18n.on('languageChanged', applyLangDir);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>,
);
