"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useToast } from "@/components/ui/toast";
import { PasswordInput } from "@/components/shared/PasswordInput";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const tokenFromUrl = searchParams.get("token") || "";
  const [code, setCode] = React.useState(tokenFromUrl);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      toast("Kode verifikasi tidak valid. Periksa kembali email Anda.", "error");
      return;
    }

    if (password.length < 6) {
      toast("Kata sandi minimal berisi 6 karakter.", "error");
      return;
    }

    if (password !== confirmPassword) {
      toast("Konfirmasi kata sandi tidak cocok.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code, email: email.trim() || undefined, password }),
      });
      const data = await response.json();

      if (response.ok && data.ok) {
        setSuccess(true);
        toast("Sandi berhasil diganti! Silakan masuk kembali.", "success");
      } else {
        toast(data.message || "Gagal mengganti kata sandi.", "error");
      }
    } catch {
      toast("Terjadi gangguan sistem. Silakan coba lagi.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center sm:justify-start">
        <BrandLogo compact showWordmark={false} />
      </div>

      <div className="text-center sm:text-left space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Setel Ulang Sandi</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Masukkan kode verifikasi dari email, lalu tentukan kata sandi baru.</p>
      </div>

      {success ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-primary">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="font-bold text-sm">Kata Sandi Diperbarui!</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">Sandi Anda sudah diperbarui dengan aman di sistem. Silakan masuk kembali menggunakan kredensial baru Anda.</p>
          <Link href="/login" className="block">
            <Button variant="default" className="w-full text-xs font-bold gap-1">
              Masuk Sekarang <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Email Terdaftar</label>
            <Input type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Kode Verifikasi</label>
            <div className="relative">
              <Input inputMode="numeric" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="pl-10 text-center text-lg font-bold tracking-[0.5em]" />
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-[11px] text-muted-foreground">Kode 6 digit dikirim ke email Anda, berlaku 1 jam.</p>
            <button
              type="button"
              onClick={() => router.push(`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`)}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Kirim Ulang Kode
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Kata Sandi Baru</label>
            <PasswordInput required placeholder="Minimal 6 karakter" value={password} onChange={(e) => setPassword(e.target.value)} showLockIcon />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Ulangi Kata Sandi Baru</label>
            <PasswordInput required placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} showLockIcon />
          </div>

          <Button type="submit" variant="default" isLoading={loading} className="w-full font-bold h-11 text-sm shadow-sm">
            Setel Kata Sandi Baru
          </Button>
        </form>
      )}

      <div className="text-center text-xs text-muted-foreground pt-2">
        <Link href="/login" className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Batal & Kembali masuk
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div className="text-center text-sm p-8 text-muted-foreground">Memuat halaman reset...</div>}>
      <ResetPasswordForm />
    </React.Suspense>
  );
}
