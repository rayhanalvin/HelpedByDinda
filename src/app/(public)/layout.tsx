"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Menu, X, BookOpen, ArrowRight, PhoneCall, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { BrandLogo, useSiteSettings } from "@/components/shared/BrandLogo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { name: "Beranda", href: "/" },
  { name: "Program Belajar", href: "/program" },
  { name: "Daftar Pengajar", href: "/pengajar-publik" },
  { name: "Berita", href: "/berita" },
  { name: "Tentang Kami", href: "/tentang" },
  { name: "Kontak", href: "/kontak" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { site } = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Banner Alert / Demo switch */}
      <div className="bg-primary/5 border-b border-primary/10 px-4 py-2 text-center text-xs sm:text-sm text-foreground flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="font-medium text-primary">Pendaftaran Periode Baru Dibuka!</span>
          <span className="hidden md:inline text-muted-foreground">khusus siswa SD, SMP, SMA & UTBK.</span>
        </div>
        <div className="mx-auto sm:mx-0">
          <RoleSwitcher />
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center transition-transform hover:scale-[1.02]">
            <BrandLogo compact className="" showWordmark={false} />
            <div className="ml-2">
              <span className="block text-lg font-extrabold tracking-tight text-foreground leading-tight">{site.name}</span>
              <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase block">Bimbel Digital Modern</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.name} href={link.href} className={cn("text-sm font-medium transition-colors hover:text-primary relative py-1", isActive ? "text-primary font-semibold" : "text-muted-foreground")}>
                  {link.name}
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-semibold">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="accent" size="sm" className="font-semibold gap-1.5">
                Daftar Sekarang
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Buka Menu">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && <div className="hidden" />}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand column */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <BrandLogo compact className="" showWordmark={false} />
                <span className="text-xl font-bold tracking-tight text-foreground">
                  Helped By <span className="text-primary">Dinda</span>
                </span>
              </div>
              <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
                Platform bimbingan belajar digital terpercaya. Menghubungkan murid dengan pengajar terbaik lewat kurikulum terstruktur, absensi transparan, rekap otomatis, dan materi berkualitas tinggi.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" /> {site.address}
                </span>
                <span className="flex items-center gap-1.5">
                  <PhoneCall className="h-4 w-4 text-accent" /> {site.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-primary" /> cs.helpeddinda@gmail.com
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-3">Program</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/program" className="hover:text-primary transition-colors">
                    Bimbel SD (Kelas 1-6)
                  </Link>
                </li>
                <li>
                  <Link href="/program" className="hover:text-primary transition-colors">
                    Bimbel SMP (Kelas 7-9)
                  </Link>
                </li>
                <li>
                  <Link href="/program" className="hover:text-primary transition-colors">
                    Bimbel SMA/SMK (Kelas 10-12)
                  </Link>
                </li>
                <li>
                  <Link href="/program" className="hover:text-primary transition-colors">
                    Mahasiswa (semester 1-8) & UTBK
                  </Link>
                </li>
              </ul>
            </div>

            {/* Platform Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-3">Portal Pengguna</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-primary transition-colors">
                    Dasbor Murid
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-primary transition-colors">
                    Dasbor Pengajar
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-primary transition-colors">
                    Dasbor Admin
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-primary transition-colors">
                    Hubungi Dukungan
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
            <p>
              © {new Date().getFullYear()} {site.name}. Seluruh hak cipta dilindungi.
            </p>
            <div className="flex gap-4">
              <Link href="/tentang" className="hover:text-primary">
                Tentang Kami
              </Link>
              <Link href="/kontak" className="hover:text-primary">
                Bantuan & FAQ
              </Link>
              <Link href="/login" className="hover:text-primary">
                Masuk Akun
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
