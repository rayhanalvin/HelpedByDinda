"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, User, Mail, Lock, School, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useToast } from "@/components/ui/toast";
import { ProfileAvatarUploader } from "@/components/shared/ProfileAvatarUploader";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { KELAS_OPTIONS } from "@/lib/kelas";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    nama: "",
    email: "",
    password: "",
    avatarUrl: "",
    kelas: "SMA10",
    sekolah: "",
    namaWali: "",
    phoneWali: "",
    programId: "",
  });

  React.useEffect(() => {
    const programId = new URLSearchParams(window.location.search).get("program");
    if (programId) setFormData((current) => ({ ...current, programId }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          toast(data.message || "Gagal mendaftar akun.", "error");
          return;
        }

        toast("Pendaftaran akun murid berhasil! Silakan masuk.", "success");
        // Arahkan ke halaman masuk dan isi email secara otomatis.
        router.push(`/login?email=${encodeURIComponent(formData.email)}`);
      } catch {
        toast("Gagal mendaftar akun. Silakan coba lagi.", "error");
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-center sm:justify-start">
        <BrandLogo compact showWordmark={false} />
      </div>
      <div className="text-center sm:text-left space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Daftar Murid Baru</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Lengkapi data diri untuk memulai bimbingan belajar terstruktur.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="flex items-start gap-4">
          <ProfileAvatarUploader role="murid" defaultAvatarUrl={""} name={formData.nama || "Murid Baru"} onAvatarChange={(avatarUrl) => setFormData((f) => ({ ...f, avatarUrl }))} />
          <div className="flex-1">{/* keep form fields in the adjacent column */}</div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Nama Lengkap Murid</label>
          <div className="relative">
            <Input required placeholder="Contoh: Rizky Maulana" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="pl-10" />
            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Alamat Email</label>
            <div className="relative">
              <Input type="email" required placeholder="nama@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="pl-10" />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Kata Sandi</label>
            <PasswordInput required minLength={8} placeholder="Min. 8 karakter" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} showLockIcon />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Jenjang Program</label>
            <select
              className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={formData.kelas}
              onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
            >
              {KELAS_OPTIONS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Asal Sekolah</label>
            <div className="relative">
              <Input required placeholder="Contoh: SMAN 1 Jakarta" value={formData.sekolah} onChange={(e) => setFormData({ ...formData, sekolah: e.target.value })} className="pl-10" />
              <School className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Nama Orang Tua / Wali</label>
            <Input required placeholder="Contoh: Ir. Hendra Maulana" value={formData.namaWali} onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">WhatsApp Orang Tua</label>
            <div className="relative">
              <Input required placeholder="0812xxxxxxxx" value={formData.phoneWali} onChange={(e) => setFormData({ ...formData, phoneWali: e.target.value })} className="pl-10" />
              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" variant="accent" isLoading={loading} className="w-full font-bold h-11 text-sm shadow-sm">
            Selesaikan Pendaftaran
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>

      <div className="text-center text-xs text-muted-foreground pt-1">
        Sudah memiliki akun terdaftar?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}
