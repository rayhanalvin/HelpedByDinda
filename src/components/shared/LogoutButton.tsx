"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  label?: string;
  size?: "sm" | "md";
}

export function LogoutButton({ className, label = "Keluar / Logout", size = "md" }: LogoutButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST", cache: "no-store" });
    } catch {
      // Even if the API fails, clear local state and fall back to client cookie clearing below.
    }
    // Clear local auth-related state so no dashboard layout can bounce the user back.
    try {
      ["admin", "pengajar", "murid"].forEach((role) => {
        window.localStorage.removeItem(`helped-by-dinda:name:${role}`);
        window.localStorage.removeItem(`helped-by-dinda-avatar:${role}`);
        window.localStorage.removeItem(`helped-by-dinda-email:${role}`);
        window.localStorage.removeItem(`helped-by-dinda:name`);
        window.localStorage.removeItem(`helped-by-dinda-avatar`);
        window.localStorage.removeItem(`helped-by-dinda-email`);
      });
    } catch {
      // Ignore localStorage failures (private mode etc.)
    }
    // Force-clearing the cookie client-side as a fallback in case the API could not be reached.
    document.cookie = "hbd_session=; Path=/; Max-Age=0; SameSite=Lax";
    // Full page navigation guarantees a clean state and lands on the public home page
    // (https://helpedbydinda.vercel.app) for every actor role.
    window.location.href = "/";
  };

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className={cn(
        "flex items-center gap-2.5 rounded-xl font-medium transition-colors disabled:opacity-60",
        size === "sm" ? "px-3 py-2 text-xs" : "px-3.5 py-2.5 text-sm",
        className || "text-muted-foreground hover:text-destructive hover:bg-rose-50",
      )}
      disabled={loading}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      <span>{loading ? "Keluar..." : label}</span>
    </button>
  );
}
