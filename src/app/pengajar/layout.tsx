"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarCheck2, FolderKanban, Calendar, Coins, UserCircle, Menu, X, Sparkles, LogOut, ChevronRight, Briefcase, ClipboardCheck, ClipboardList, BellRing } from "lucide-react";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { BrandLogo, useSiteSettings } from "@/components/shared/BrandLogo";
import { Badge } from "@/components/ui/badge";
import { DUMMY_PENGAJAR } from "@/lib/dummy-data";
import { formatRupiah, cn } from "@/lib/utils";
import { useProfileAvatar, useProfileName } from "@/components/shared/ProfileAvatarUploader";
import { apiFetch } from "@/lib/api";
import { MessageInbox } from "@/components/shared/MessageInbox";

const PENGAJAR_MENU = [
  { name: "Dasbor", href: "/pengajar/dashboard", icon: LayoutDashboard },
  { name: "Absen Saya", href: "/pengajar/absen", icon: CalendarCheck2 },
  { name: "Kelola Materi", href: "/pengajar/materi", icon: FolderKanban },
  { name: "Kelola Quiz", href: "/pengajar/quiz", icon: ClipboardCheck },
  { name: "Rapot Murid", href: "/pengajar/rapot", icon: ClipboardList },
  { name: "Jadwal Mengajar", href: "/pengajar/jadwal", icon: Calendar },
  { name: "Katalog Ujian", href: "/pengajar/katalog-ujian", icon: BellRing },
  { name: "Rekap Fee Saya", href: "/pengajar/fee", icon: Coins },
  { name: "Profil Saya", href: "/pengajar/profil", icon: UserCircle },
];

export default function PengajarLayout({ children }: { children: React.ReactNode }) {
  const { site } = useSiteSettings();
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [profile, setProfile] = React.useState({
    name: DUMMY_PENGAJAR[0].nama,
    avatarUrl: DUMMY_PENGAJAR[0].avatarUrl,
    spesialisasi: DUMMY_PENGAJAR[0].spesialisasi,
    nominalPerJam: DUMMY_PENGAJAR[0].nominalPerJam,
    userId: undefined as string | undefined,
  });

  React.useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const result = await apiFetch<{ ok: boolean; user: { id: string; name: string; avatarUrl?: string | null; role?: string } }>("/api/profile");
        if (!active) return;

        setProfile({
          name: result.user.name || DUMMY_PENGAJAR[0].nama,
          avatarUrl: result.user.avatarUrl || DUMMY_PENGAJAR[0].avatarUrl,
          spesialisasi: DUMMY_PENGAJAR[0].spesialisasi,
          nominalPerJam: DUMMY_PENGAJAR[0].nominalPerJam,
          userId: result.user.id,
        });
      } catch {
        // Fallback to dummy teacher values if the session is unavailable.
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const { name: activePengajarName } = useProfileName("pengajar", profile.name, profile.userId);
  const { avatarUrl } = useProfileAvatar("pengajar", profile.avatarUrl, profile.userId);

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30 bg-card border-r border-border">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-border">
          <BrandLogo compact className="" showWordmark={false} />
          <div>
            <span className="font-extrabold text-foreground tracking-tight block leading-tight text-base">{site.name}</span>
            <span className="text-[10px] font-bold text-accent tracking-wider uppercase block">Portal Pengajar</span>
          </div>
        </div>

        {/* Teacher Profile Card */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-secondary/50 border border-primary/10 flex items-center gap-3">
          <Image src={avatarUrl} alt={activePengajarName} width={40} height={40} unoptimized className="h-10 w-10 rounded-xl object-cover border border-primary/20" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">{activePengajarName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{profile.spesialisasi}</p>
            <p className="text-[10px] font-bold text-emerald-700 mt-0.5">{formatRupiah(profile.nominalPerJam)}/jam</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {PENGAJAR_MENU.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/pengajar/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group",
                  isActive ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-primary")} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom links */}
        <div className="p-4 border-t border-border space-y-2">
          <Link href="/login" className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-rose-50">
            <LogOut className="h-4 w-4" />
            <span>Keluar Akun</span>
          </Link>
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
              <Badge variant="success" className="gap-1.5 py-1">
                <Briefcase className="h-3.5 w-3.5" />
                Mode Pengajar Aktif
              </Badge>
              <span className="text-xs text-muted-foreground">Tutor Terverifikasi</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <MessageInbox />
            <RoleSwitcher />
            <Link href="/pengajar/profil" className="flex items-center gap-2 p-1 rounded-xl hover:bg-muted transition-colors">
              <Image src={avatarUrl} alt={activePengajarName} width={32} height={32} unoptimized className="h-8 w-8 rounded-lg object-cover border border-border" />
            </Link>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setMobileDrawerOpen(false)} />
          <div className="relative flex flex-col w-72 max-w-[80vw] bg-card border-r border-border h-full p-4 shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <BrandLogo compact className="" showWordmark={false} />
                <span className="font-bold text-sm">{site.name}</span>
              </div>
              <button onClick={() => setMobileDrawerOpen(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 p-3 rounded-xl bg-secondary/50 flex items-center gap-3">
              <Image src={avatarUrl} alt={activePengajarName} width={36} height={36} unoptimized className="h-9 w-9 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{activePengajarName}</p>
                <p className="text-[10px] text-muted-foreground">{profile.spesialisasi}</p>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {PENGAJAR_MENU.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/pengajar/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={cn("flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors", isActive ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
