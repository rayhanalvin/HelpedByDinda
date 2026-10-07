"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useToast } from "@/components/ui/toast";
import { PasswordInput } from "@/components/shared/PasswordInput";

type AuthRole = "admin" | "pengajar" | "murid";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<AuthRole>("pengajar");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const role = new URLSearchParams(window.location.search).get("role");
    if (role === "admin" || role === "pengajar" || role === "murid") {
      setSelectedRole(role);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role: selectedRole,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast(data.message || "Email atau password salah.", "error");
        return;
      }
      try {
        const localName = window.localStorage.getItem(`helped-by-dinda:name:${selectedRole}`) || window.localStorage.getItem(`helped-by-dinda:name`) || data.user.name;
        const localAvatar = window.localStorage.getItem(`helped-by-dinda-avatar:${selectedRole}`) || window.localStorage.getItem(`helped-by-dinda-avatar`) || data.user.avatarUrl || null;
        const localEmail = window.localStorage.getItem(`helped-by-dinda-email:${selectedRole}`) || window.localStorage.getItem(`helped-by-dinda-email`) || data.user.email;
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: localName, avatarUrl: localAvatar, email: localEmail }),
        });
      } catch {}
      toast("Berhasil masuk! Selamat datang.", "success");
      const serverRole = String(data?.user?.role || "").toLowerCase();
      if (serverRole === "admin") router.push("/admin/dashboard");
      else if (serverRole === "pengajar") router.push("/pengajar/dashboard");
      else router.push("/murid/dashboard");
    } catch (error) {
      console.error(error);
      toast("Gagal masuk. Silakan coba lagi beberapa saat.", "error");
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
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Masuk ke Akun</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Silakan masukkan email dan kata sandi Anda yang terdaftar.</p>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-muted/30 p-1.5">
        {(["admin", "pengajar", "murid"] as const).map((role) => (
          <button
            type="button"
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`rounded-xl px-2 py-2 text-[11px] font-bold transition-colors ${selectedRole === role ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
          >
            {role === "admin" ? "Admin" : role === "pengajar" ? "Pengajar" : "Murid"}
          </button>
        ))}
      </div>

      {/* Formulir Masuk */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Alamat Email</label>
          <div className="relative">
            <Input type="email" required placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Kata Sandi</label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
              Lupa sandi?
            </Link>
          </div>
          <PasswordInput required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} showLockIcon />
        </div>

        <Button type="submit" variant="default" isLoading={loading} className="w-full font-bold h-11 text-sm shadow-sm">
          Masuk Sekarang
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="text-center text-xs text-muted-foreground pt-2">
        Belum memiliki akun murid?{" "}
        <Link href="/register" className="font-bold text-primary hover:underline">
          Daftar sekarang
        </Link>
      </div>
    </div>
  );
}
