"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, GraduationCap, ShieldCheck, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function RoleSwitcher() {
  const pathname = usePathname();

  const roles = [
    { label: "Publik", href: "/", icon: Globe, active: pathname === "/" || pathname.startsWith("/tentang") || pathname.startsWith("/program") },
    { label: "Murid", href: "/murid/dashboard", icon: GraduationCap, active: pathname.startsWith("/murid") },
    { label: "Pengajar", href: "/pengajar/dashboard", icon: Users, active: pathname.startsWith("/pengajar") },
    { label: "Admin", href: "/admin/dashboard", icon: ShieldCheck, active: pathname.startsWith("/admin") },
  ];

  return (
    <div className="flex items-center gap-1 rounded-xl bg-muted/80 p-1 text-xs border border-border">
      <span className="hidden lg:inline-block px-2 font-medium text-muted-foreground">Demo Role:</span>
      {roles.map((r) => {
        const Icon = r.icon;
        return (
          <Link
            key={r.label}
            href={r.href}
            aria-label={r.label}
            title={r.label}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 font-medium transition-all sm:px-2.5",
              r.active
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:bg-background hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">{r.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
