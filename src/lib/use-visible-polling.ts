"use client";

import * as React from "react";

export function useVisiblePolling(callback: () => void | Promise<void>, intervalMs: number) {
  const callbackRef = React.useRef(callback);
  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  React.useEffect(() => {
    let running = false;
    const run = async () => {
      if (document.visibilityState !== "visible" || running) return;
      running = true;
      try {
        await callbackRef.current();
      } finally {
        running = false;
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void run();
    };
    const interval = window.setInterval(() => void run(), intervalMs);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs]);
}
