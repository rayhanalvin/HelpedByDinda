"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useToast } from "@/components/ui/toast";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [devCode, setDevCode] = React.useState("");
  const [resendCooldown, setResendCooldown] = React.useState(0);

  React.useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("email");
    if (fromUrl) setEmail(fromUrl);
  }, []);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => setResendCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const requestCode = async () => {
    if (!email) return;
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return response.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const data = await requestCode();
      setResendCooldown(0);

      if (data?.ok) {
        setSent(true);
        if (data.devCode) setDevCode(data.devCode);
        toast("Tautan pemulihan kata sandi telah dikirim ke email.", "success");
        setResendCooldown(30);
      } else {
        toast(data.message || "Gagal mengirim permintaan reset sandi.", "error");
      }
    } catch {
      toast("Gagal mengirim tautan pengaturan ulang. Silakan coba lagi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setDevCode("");
    try {
      const data = await requestCode();
      if (data?.ok) {
        if (data.devCode) setDevCode(data.devCode);
        toast("Kode verifikasi baru dikirim ke email. Periksa kotak masuk.", "success");
        setResendCooldown(30);
      } else {
        toast(data.message || "Gagal mengirim ulang. Silakan coba lagi.", "error");
      }
    } catch {
      toast("Gagal mengirim ulang. Silakan coba lagi.", "error");
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
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Lupa Kata Sandi</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Kami akan mengirimkan kode verifikasi 6 digit ke email Anda untuk menyetel ulang kata sandi.</p>
      </div>

      {sent ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="font-bold text-sm">Kode Verifikasi Dikirim!</span>
          </div>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Kode 6 digit sudah dikirimkan ke email <strong className="font-extrabold">{email}</strong>. Periksa kotak masuk atau folder spam, lalu lanjutkan untuk memasukkan kode dan mengganti kata sandi.
          </p>
          {devCode && (
            <div className="rounded-xl border border-emerald-200 bg-white p-4 text-center">
              <p className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">Kode Verifikasi (Mode Demo)</p>
              <p className="mt-1 text-2xl font-extrabold tracking-[0.4em] text-emerald-700">{devCode}</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-2">
            <Link href="/reset-password">
              <Button variant="default" className="w-full text-xs font-bold">
                Masukkan Kode & Ganti Sandi
              </Button>
            </Link>
            <Button variant="outline" className="w-full text-xs" disabled={resendCooldown > 0 || loading} onClick={handleResend}>
              {resendCooldown > 0 ? `Kirim Ulang Kode (${resendCooldown}s)` : "Kirim Ulang Kode"}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Alamat Email Terdaftar</label>
            <div className="relative">
              <Input type="email" required placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <Button type="submit" variant="default" isLoading={loading} className="w-full font-bold h-11 text-sm shadow-sm gap-2">
            Kirim Tautan Reset <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      )}

      <div className="text-center text-xs text-muted-foreground pt-2">
        <Link href="/login" className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Halaman Masuk
        </Link>
      </div>
    </div>
  );
}
