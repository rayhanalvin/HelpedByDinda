"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  CalendarCheck2,
  FolderKanban,
  BellRing,
  CreditCard,
  Coins,
  Send,
  Settings,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  ClipboardCheck,
  WalletCards,
  ClipboardList,
} from "lucide-react";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { BrandLogo, useSiteSettings } from "@/components/shared/BrandLogo";
import { Badge } from "@/components/ui/badge";
import { DUMMY_ADMIN } from "@/lib/dummy-data";
import { useProfileName } from "@/components/shared/ProfileAvatarUploader";
import { cn } from "@/lib/utils";
import { useProfileAvatar } from "@/components/shared/ProfileAvatarUploader";
import { apiFetch } from "@/lib/api";

const ADMIN_MENU = [
  { name: "Dasbor Utama", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Data Murid", href: "/admin/murid", icon: GraduationCap },
  { name: "Data Pengajar", href: "/admin/pengajar", icon: Users },
  { name: "Kelola Jadwal", href: "/admin/jadwal", icon: Calendar },
  { name: "Monitoring Absensi", href: "/admin/absensi", icon: CalendarCheck2 },
  { name: "Moderasi Materi", href: "/admin/materi", icon: FolderKanban },
  { name: "Kelola Berita", href: "/admin/berita", icon: FolderKanban },
  { name: "Kelola Program", href: "/admin/program", icon: Sparkles },
  { name: "Kelola Quiz", href: "/admin/quiz", icon: ClipboardCheck },
  { name: "Katalog Ujian", href: "/admin/katalog-ujian", icon: BellRing },
  { name: "Tracking Pembayaran", href: "/admin/pembayaran", icon: CreditCard },
  { name: "Rekap Fee Pengajar", href: "/admin/fee", icon: Coins },
  { name: "Finance", href: "/admin/finance", icon: WalletCards },
  { name: "Monitoring Rapot", href: "/admin/rapot", icon: ClipboardList },
  { name: "Pusat Pengingat", href: "/admin/pengingat", icon: Send },
  { name: "Pengaturan Sistem", href: "/admin/pengaturan", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { site } = useSiteSettings();
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [profile, setProfile] = React.useState({
    name: DUMMY_ADMIN.nama,
    avatarUrl: DUMMY_ADMIN.avatarUrl,
    userId: undefined as string | undefined,
  });

  React.useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const result = await apiFetch<{ ok: boolean; user: { id: string; name: string; avatarUrl?: string | null } }>("/api/profile");
        if (!active) return;

        setProfile({
          name: result.user.name || DUMMY_ADMIN.nama,
          avatarUrl: result.user.avatarUrl || DUMMY_ADMIN.avatarUrl,
          userId: result.user.id,
        });
      } catch (error) {
        // Session invalid or expired: return to the public home page instead of
        // showing a dummy profile that could be mistaken for a live session.
        const unauthorized = error instanceof Error && /unauthorized/i.test(error.message);
        if (active && unauthorized && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/";
        }
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const { name: adminName } = useProfileName("admin", profile.name, profile.userId);
  const { avatarUrl } = useProfileAvatar("admin", profile.avatarUrl, profile.userId);

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30 bg-card border-r border-border">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-border">
          <BrandLogo compact className="" showWordmark={false} />
          <div>
            <span className="font-extrabold text-foreground tracking-tight block leading-tight text-base">{site.name}</span>
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase block">Super Admin</span>
          </div>
        </div>

        {/* Admin Profile Card */}
        <div className="p-3 mx-3 my-2.5 rounded-2xl bg-secondary/50 border border-primary/10 flex items-center gap-3">
          <Image src={avatarUrl} alt={adminName} width={36} height={36} unoptimized className="h-9 w-9 rounded-xl object-cover border border-primary/20" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">{adminName}</p>
            <p className="text-[10px] text-muted-foreground truncate">Founder & Superadmin</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
          {ADMIN_MENU.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn("flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group", isActive ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-primary")} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom links */}
        <div className="p-3 border-t border-border">
          <LogoutButton label="Keluar Sesi Admin" size="sm" className="w-full justify-start px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-rose-50" />
        </div>
      </aside>

      {/* Main Area */}
      <div className="min-w-0 flex-1 flex flex-col lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-background/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileDrawerOpen(true)} className="lg:hidden p-2 rounded-xl border border-border text-foreground hover:bg-muted" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="default" className="gap-1.5 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Panel Administrator
              </Badge>
              <span className="text-xs text-muted-foreground">Sistem Berjalan Normal</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="relative group">
              <Image src={avatarUrl} alt={adminName} width={32} height={32} unoptimized className="h-8 w-8 rounded-lg object-cover border border-border cursor-pointer" />
              <div className="absolute right-0 top-10 z-40 hidden min-w-44 flex-col gap-1 rounded-xl border border-border bg-card p-2 shadow-xl group-hover:flex group-focus-within:flex">
                <p className="px-1.5 py-1 text-xs font-bold text-foreground truncate">{adminName}</p>
                <LogoutButton label="Logout" size="sm" className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-rose-50" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setMobileDrawerOpen(false)} />
          <div className="relative flex flex-col w-72 max-w-[80vw] bg-card border-r border-border h-dvh overflow-y-auto p-4 shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <BrandLogo compact className="" showWordmark={false} />
                <span className="font-bold text-sm">{site.name}</span>
              </div>
              <button onClick={() => setMobileDrawerOpen(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-3 p-3 rounded-xl bg-secondary/50 flex items-center gap-3">
              <Image src={avatarUrl} alt={adminName} width={36} height={36} unoptimized className="h-9 w-9 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{adminName}</p>
                <p className="text-[10px] text-muted-foreground">Admin Bimbel</p>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {ADMIN_MENU.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={cn("flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors", isActive ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3 border-t border-border pt-3">
              <LogoutButton label="Keluar Sesi Admin" size="sm" className="w-full justify-start text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-rose-50" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
