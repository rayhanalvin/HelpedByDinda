"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { usePathname } from "next/navigation";

type DynamicBannerData = {
  judul: string;
  ringkasan: string | null;
  isi: string;
  imageUrl: string | null;
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRegister = pathname?.includes("/register");
  const bannerSlug = isRegister ? "register-banner" : "login-banner";

  const [banner, setBanner] = React.useState<DynamicBannerData | null>(null);

  React.useEffect(() => {
    fetch(`/api/portal/${bannerSlug}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          setBanner(res.data);
        }
      })
      .catch(() => {});
  }, [bannerSlug]);

  const defaultBannerTitle = isRegister ? "Mulai Perjalanan Belajar yang Lebih Terarah" : "Selamat Datang di Ruang Belajar Modern";
  const defaultBannerCreator = "Dinda Rizky Febriyanti, S.A.B.";
  const defaultBannerCreatorTitle = "Founder & Academic Director";
  const defaultBannerCreatorImage = "/helpedd.jpeg";
  const defaultSubTitle = isRegister ? "Bangun kebiasaan belajar bersama kami" : "Belajar lebih terarah, tumbuh lebih percaya diri";

  const normalizeBannerText = (value: string) =>
    value
      .replace(/Bimbingan\s+Beaja/gi, "Bimbingan Belajar")
      .replace(/\bMen\s+Teaah\b/gi, "Modern dan Terarah")
      .replace(/\bTeaah\b/gi, "Terarah");

  // Allow quick overrides via NEXT_PUBLIC_ environment variables (client-safe)
  const envLoginBanner = process.env.NEXT_PUBLIC_LOGIN_BANNER;
  const envRegisterBanner = process.env.NEXT_PUBLIC_REGISTER_BANNER;

  const title = normalizeBannerText(banner?.judul || defaultBannerTitle);
  const rawSubInfo = normalizeBannerText(banner?.ringkasan || `${defaultBannerCreator}||${defaultBannerCreatorTitle}||${defaultSubTitle}`);
  const [creatorName, creatorTitle, subTitle] = rawSubInfo.split("||");

  const finalCreatorName = creatorName?.trim() || defaultBannerCreator;
  const finalCreatorTitle = creatorTitle?.trim() || defaultBannerCreatorTitle;
  const finalSubTitle = subTitle?.trim() || defaultSubTitle;
  // Prefer dynamic banner from API -> env override -> default public image
  const envImage = isRegister ? envRegisterBanner : envLoginBanner;
  const rawImage = banner?.imageUrl || envImage || defaultBannerCreatorImage;

  const normalizeImageSrc = (src: string | null | undefined) => {
    if (!src) return defaultBannerCreatorImage;
    const s = String(src).trim();
    if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) return s;
    // If caller provided a path like './public/filename.jpg' or 'public/filename.jpg' or './filename.jpg', normalize to '/filename.jpg'
    if (s.startsWith("./public/")) return "/" + s.replace(/^\.\/public\//, "");
    if (s.startsWith("public/")) return "/" + s.replace(/^public\//, "");
    if (s.startsWith("./")) return "/" + s.replace(/^\.\//, "");
    if (s.startsWith("/")) return s;
    return "/" + s;
  };

  const finalImage = normalizeImageSrc(rawImage);

  const defaultPoints = ["Jadwal mengajar dan absensi digital 100% transparan", "Akses materi video Bunny Stream dan modul latihan PDF", "Pembayaran praktis langsung otomatis via Midtrans Snap"];
  const bulletPoints = banner?.isi
    ? normalizeBannerText(banner.isi)
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean)
    : defaultPoints;
  const [activePoint, setActivePoint] = React.useState(0);

  React.useEffect(() => {
    if (bulletPoints.length < 2) return;
    const interval = window.setInterval(() => {
      setActivePoint((current) => (current + 1) % bulletPoints.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [bulletPoints.length]);

  React.useEffect(() => {
    setActivePoint(0);
  }, [bannerSlug]);

  const currentPoint = bulletPoints[activePoint] || bulletPoints[0];

  return (
    <div className="min-h-screen bg-background lg:flex lg:flex-row">
      <div className="relative overflow-hidden bg-linear-to-br from-primary via-primary/95 to-purple-800 px-5 pb-8 pt-6 text-white sm:px-8 lg:flex lg:min-h-screen lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        {/* Background ambient shapes */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <BrandLogo compact showWordmark={false} light />
          </Link>
          <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md">{isRegister ? "Pendaftaran Murid" : "Portal Pembelajaran"}</div>
        </div>

        <div className="relative z-10 mx-auto mt-8 max-w-lg space-y-5 lg:mt-0 lg:space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            {finalSubTitle}
          </div>
          <h2 className="max-w-xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">{title.replace(/[“”"]/g, "")}</h2>
          <p className="max-w-xl text-sm leading-6 text-white/75 sm:text-base">Platform bimbingan belajar yang membantu Anda mengatur jadwal, materi, dan perkembangan belajar dalam satu tempat.</p>
          <div className="flex items-center gap-3 pt-1">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white/40">
              <Image src={finalImage} alt={finalCreatorName} fill className="object-cover" />
            </div>
            <div>
              <p className="font-bold text-white leading-tight">{finalCreatorName}</p>
              <p className="text-xs text-white/80">{finalCreatorTitle}</p>
            </div>
          </div>

          <div className="hidden border-t border-white/15 pt-6 lg:block">
            <div className="grid gap-2 sm:grid-cols-3">
              {bulletPoints.map((point, index) => (
                <button
                  key={`${point}-${index}`}
                  type="button"
                  onClick={() => setActivePoint(index)}
                  className={`rounded-2xl border p-3 text-left text-xs transition-all ${activePoint === index ? "border-white/50 bg-white/20 shadow-lg" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                >
                  <CheckCircle2 className="mb-2 h-4 w-4 text-accent" />
                  <span className="leading-5 text-white/90">{point}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md lg:hidden">
            <button type="button" aria-label="Fitur sebelumnya" onClick={() => setActivePoint((activePoint - 1 + bulletPoints.length) % bulletPoints.length)} className="rounded-full p-1.5 hover:bg-white/10">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex min-w-0 items-center gap-2 px-2 text-xs font-semibold leading-5 text-white/90">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
              <span className="line-clamp-2">{currentPoint}</span>
            </div>
            <button type="button" aria-label="Fitur berikutnya" onClick={() => setActivePoint((activePoint + 1) % bulletPoints.length)} className="rounded-full p-1.5 hover:bg-white/10">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative z-10 mt-8 hidden items-center justify-between text-xs text-white/70 lg:flex">
          <span>© {new Date().getFullYear()} Helped By Dinda</span>
          <span className="inline-flex items-center gap-1 text-white/80">
            Mulai sekarang <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      <div className="relative flex min-h-[calc(100vh-340px)] flex-1 flex-col justify-center px-4 py-8 sm:px-6 md:px-10 lg:min-h-screen lg:px-16">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <RoleSwitcher />
        </div>

        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
