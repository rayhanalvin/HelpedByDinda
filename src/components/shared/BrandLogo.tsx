"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

export type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  light?: boolean;
  showWordmark?: boolean;
};

export type SiteIdentity = {
  name: string;
  tagline: string;
  logoUrl: string;
  wordmark: string;
  supportEmail?: string;
  phone?: string;
  address?: string;
};

const defaultSiteIdentity: SiteIdentity = {
  name: "Helped By Dinda",
  tagline: "Bimbel Digital Modern",
  logoUrl: "/helpedd.jpeg",
  wordmark: "Platform Belajar Modern",
  supportEmail: "cs.helpeddinda@gmail.com",
  phone: "082381188058",
  address: "Pesanggrahan, Petukangan Utara",
};

let cachedSite: SiteIdentity | null = null;
let sitePromise: Promise<SiteIdentity | null> | null = null;

async function fetchSiteSettings(): Promise<SiteIdentity | null> {
  try {
    const result = await apiFetch<{ ok: boolean; data: Partial<SiteIdentity> | null }>("/api/site-settings");
    if (!result.ok || !result.data) return null;
    return { ...defaultSiteIdentity, ...result.data };
  } catch {
    return null;
  }
}

function getSiteSettings(): Promise<SiteIdentity | null> {
  if (cachedSite) return Promise.resolve(cachedSite);
  if (!sitePromise) {
    sitePromise = fetchSiteSettings()
      .then((site) => {
        cachedSite = site;
        return site;
      })
      .finally(() => {
        sitePromise = null;
      });
  }
  return sitePromise;
}

export function useSiteSettings() {
  const [site, setSite] = React.useState<SiteIdentity>(cachedSite || defaultSiteIdentity);

  React.useEffect(() => {
    let active = true;
    void getSiteSettings().then((next) => {
      if (active && next) setSite(next);
    });

    const handleChange = () => {
      cachedSite = null;
      void getSiteSettings().then((next) => {
        if (active && next) setSite(next);
      });
    };
    window.addEventListener("site-settings-change", handleChange);
    return () => {
      active = false;
      window.removeEventListener("site-settings-change", handleChange);
    };
  }, []);

  return { site };
}

export function BrandLogo({ className, compact = false, light = false, showWordmark = true }: BrandLogoProps) {
  const { site } = useSiteSettings();

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn("relative flex items-center justify-center rounded-full bg-white shadow-[0_12px_32px_rgba(15,23,42,0.12)] ring-1 ring-black/5 overflow-hidden", compact ? "h-14 w-14" : "h-28 w-28 sm:h-32 sm:w-32")}>
        <img src={site.logoUrl} alt={`${site.name} Logo`} className="h-full w-full object-cover" />
      </div>

      {showWordmark && (
        <div
          className={cn("mt-5 text-center font-[Georgia,Times_New_Roman,serif] uppercase tracking-[0.22em] leading-none", light ? "text-white" : "text-slate-800", compact ? "text-[0.6rem]" : "text-[0.75rem] sm:text-[1rem]")}
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {site.name} <span className="text-sm font-normal block">{site.wordmark || site.tagline}</span>
        </div>
      )}
    </div>
  );
}
