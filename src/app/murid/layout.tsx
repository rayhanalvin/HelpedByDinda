"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CalendarCheck2, BookOpenCheck, CreditCard, Calendar, BellRing, ClipboardCheck, UserCircle, Menu, X, Sparkles, ChevronRight, GraduationCap, ClipboardList, FileCheck2 } from "lucide-react";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { BrandLogo, useSiteSettings } from "@/components/shared/BrandLogo";
import { Badge } from "@/components/ui/badge";
import { DUMMY_MURID } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";
import { useProfileAvatar, useProfileName } from "@/components/shared/ProfileAvatarUploader";
import { apiFetch } from "@/lib/api";
import { MessageInbox } from "@/components/shared/MessageInbox";
import { getKelasLabel } from "@/lib/kelas";

const MURID_MENU = [
  { name: "Dasbor", href: "/murid/dashboard", icon: LayoutDashboard },
  { name: "Absen Saya", href: "/murid/absen", icon: CalendarCheck2 },
  { name: "Materi Belajar", href: "/murid/materi", icon: BookOpenCheck },
  { name: "Pembayaran Saya", href: "/murid/pembayaran", icon: CreditCard },
  { name: "Bukti Pembayaran", href: "/murid/bukti-pembayaran", icon: FileCheck2 },
  { name: "Jadwal Saya", href: "/murid/jadwal", icon: Calendar },
  { name: "Katalog Ujian", href: "/murid/katalog-ujian", icon: BellRing },
  { name: "Quiz & Latihan", href: "/murid/quiz", icon: ClipboardCheck },
  { name: "Rapot & Asesmen", href: "/murid/rapot", icon: ClipboardList },
  { name: "Profil Saya", href: "/murid/profil", icon: UserCircle },
];

export default function MuridLayout({ children }: { children: React.ReactNode }) {
  const { site } = useSiteSettings();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [profile, setProfile] = React.useState({
    name: DUMMY_MURID[0].nama,
    avatarUrl: DUMMY_MURID[0].avatarUrl,
    kelas: String(DUMMY_MURID[0].kelas),
    sekolah: DUMMY_MURID[0].sekolah,
    userId: undefined as string | undefined,
  });

  React.useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const result = await apiFetch<{
          user: {
            id: string;
            name: string;
            avatarUrl?: string | null;
            murid?: {
              kelas?: string | null;
              sekolah?: string | null;
              statusBayarBulanIni?: string | null;
              onboardingComplete?: boolean | null;
            } | null;
          };
        }>("/api/profile");
        if (!active) return;

        setProfile({
          name: result.user.name || DUMMY_MURID[0].nama,
          avatarUrl: result.user.avatarUrl || DUMMY_MURID[0].avatarUrl,
          kelas: result.user.murid?.kelas || DUMMY_MURID[0].kelas,
          sekolah: result.user.murid?.sekolah || DUMMY_MURID[0].sekolah,
          userId: result.user.id,
        });

        const murid = result.user?.murid;
        if (murid) {
          const status = String(murid.statusBayarBulanIni || "").toUpperCase();
          const onboardingComplete = Boolean(murid.onboardingComplete);
          const isOnboardingPage = pathname === "/murid/onboarding";
          const isPaymentPage = pathname === "/murid/pembayaran";

          if (status !== "SUCCESS" && !isPaymentPage) {
            router.push("/murid/pembayaran");
            return;
          }

          if (status === "SUCCESS" && !onboardingComplete && !isOnboardingPage) {
            router.push("/murid/onboarding");
            return;
          }
        }
      } catch {
        // Fallback to dummy student values if the session is unavailable.
      }
    };

    loadProfile();
    const handleMuridChange = (event: Event) => {
      const ev = event as CustomEvent | Event;
      if (ev instanceof CustomEvent && ev.detail) {
        setProfile((cur) => ({
          ...cur,
          kelas: ev.detail.kelas || cur.kelas,
          sekolah: ev.detail.sekolah || cur.sekolah,
        }));
      } else {
        // fallback: reload profile from server
        loadProfile();
      }
    };

    window.addEventListener("profile-murid-change", handleMuridChange as EventListener);

    return () => {
      active = false;
      window.removeEventListener("profile-murid-change", handleMuridChange as EventListener);
    };
  }, [pathname, router]);

  const { name: activeMuridName } = useProfileName("murid", profile.name, profile.userId);
  const { avatarUrl } = useProfileAvatar("murid", profile.avatarUrl, profile.userId);

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30 bg-card border-r border-border">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-border">
          <BrandLogo compact className="" showWordmark={false} />
          <div>
            <span className="font-extrabold text-foreground tracking-tight block leading-tight text-base">{site.name}</span>
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase block">Portal Murid</span>
          </div>
        </div>

        {/* Student Profile Card */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-secondary/50 border border-primary/10 flex items-center gap-3">
          <Image src={avatarUrl} alt={activeMuridName} width={40} height={40} unoptimized className="h-10 w-10 rounded-xl object-cover border border-primary/20" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">{activeMuridName}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {getKelasLabel(profile.kelas)} • {profile.sekolah}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {MURID_MENU.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/murid/dashboard" && pathname.startsWith(item.href));
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
          <LogoutButton label="Keluar Akun" size="sm" className="w-full justify-start px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-rose-50" />
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
                <GraduationCap className="h-3.5 w-3.5" />
                Mode Murid Aktif
              </Badge>
              <span className="text-xs text-muted-foreground">Semester Ganjil</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <MessageInbox />
            <div className="relative group">
              <Link href="/murid/profil" className="flex items-center gap-2 p-1 rounded-xl hover:bg-muted transition-colors">
                <Image src={avatarUrl} alt={activeMuridName} width={32} height={32} unoptimized className="h-8 w-8 rounded-lg object-cover border border-border" />
              </Link>
              <div className="absolute right-0 top-10 z-40 hidden min-w-44 flex-col gap-1 rounded-xl border border-border bg-card p-2 shadow-xl group-hover:flex group-focus-within:flex">
                <p className="px-1.5 py-1 text-xs font-bold text-foreground truncate">{activeMuridName}</p>
                <Link href="/murid/profil" className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
                  Profil Saya
                </Link>
                <LogoutButton label="Logout" size="sm" className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-rose-50" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Drawer (Bottom-sheet/Slide-over) */}
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
              <Image src={avatarUrl} alt={activeMuridName} width={36} height={36} unoptimized className="h-9 w-9 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{activeMuridName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {getKelasLabel(profile.kelas)} - {profile.sekolah}
                </p>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {MURID_MENU.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/murid/dashboard" && pathname.startsWith(item.href));
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
            <div className="mt-3 border-t border-border pt-3">
              <LogoutButton label="Keluar Akun" size="sm" className="w-full justify-start text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-rose-50" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
