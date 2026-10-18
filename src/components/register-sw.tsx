"use client";

import { useEffect } from "react";
import { basePath } from "@/lib/base-path";

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
