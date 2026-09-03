"use client";

import { useEffect } from "react";

// NEXT_PUBLIC_* vars are inlined at build time, so this correctly
// resolves to "" locally/Vercel/Capacitor and "/<repo-name>" when the
// GitHub Pages workflow sets NEXT_PUBLIC_BASE_PATH.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${basePath}/sw.js`).catch(() => {
        // installability is a nice-to-have for the POC; ignore failures
      });
    }
  }, []);
  return null;
}
