"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  label?: string;
  size?: "sm" | "md";
}

export function LogoutButton({ className, label = "Keluar / Logout", size = "md" }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the API fails, clear local state and redirect.
    } finally {
      router.replace("/");
      router.refresh();
    }
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
