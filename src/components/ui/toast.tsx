"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed inset-x-4 bottom-5 z-50 mx-auto flex max-w-sm flex-col gap-2 pointer-events-none sm:inset-x-auto sm:right-5 sm:w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center justify-between gap-3 rounded-xl border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5 duration-300",
              t.type === "success" && "bg-white border-emerald-200 text-emerald-950",
              t.type === "error" && "bg-white border-rose-200 text-rose-950",
              t.type === "info" && "bg-white border-primary/20 text-foreground",
            )}
          >
            <div className="flex items-center gap-3">
              {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
              {t.type === "error" && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
              {t.type === "info" && <Info className="h-5 w-5 text-primary shrink-0" />}
              <p className="text-sm font-medium">{t.message}</p>
            </div>
            <button onClick={() => removeToast(t.id)} className="text-muted-foreground hover:text-foreground p-1 rounded-md">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Return a fallback no-op if outside provider
    return {
      toast: () => undefined,
    };
  }
  return context;
}
