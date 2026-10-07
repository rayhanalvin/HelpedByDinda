"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ProfileAvatarUploader, useProfileName, useProfileEmail } from "@/components/shared/ProfileAvatarUploader";
import { apiFetch } from "@/lib/api";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { KELAS_OPTIONS, getKelasLabel, getKelasValue } from "@/lib/kelas";

export default function MuridProfilPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [initialData, setInitialData] = React.useState({
    nama: "",
    email: "",
    phone: "",
    kelas: "SMA10",
    sekolah: "",
    namaWali: "",
    phoneWali: "",
    avatarUrl: "",
    userId: "",
    createdAt: "",
  });

  const [formData, setFormData] = React.useState({
    nama: "",
    email: "",
    phone: "",
    kelas: "SMA10",
    sekolah: "",
    namaWali: "",
    phoneWali: "",
    avatarUrl: "",
    currentPassword: "",
    newPassword: "",
  });

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await apiFetch<{
          ok: boolean;
          user: {
            id: string;
            name: string;
            email: string;
            phone?: string | null;
            avatarUrl?: string | null;
            createdAt?: string | null;
            murid?: { kelas?: string | null; sekolah?: string | null; namaWali?: string | null; phoneWali?: string | null } | null;
          };
        }>("/api/profile");
        const user = result.user || {};
        const murid = user.murid || {};
        const next = {
          nama: user.name,
          email: user.email,
          phone: user.phone || "",
          kelas: getKelasValue(murid.kelas),
          sekolah: murid.sekolah || "",
          namaWali: murid.namaWali || "",
          phoneWali: murid.phoneWali || "",
          avatarUrl: user.avatarUrl || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
          userId: user.id,
          createdAt: user.createdAt || "",
        };
        setInitialData(next);
        setFormData({ ...next, currentPassword: "", newPassword: "" });
      } catch (error) {
        toast(error instanceof Error ? error.message : "Gagal memuat profil murid.", "error");
      }
    };

    loadProfile();
  }, [toast]);

  const { updateName } = useProfileName("murid", initialData.nama || "Murid", initialData.userId);
  const { email: localEmail, updateEmail } = useProfileEmail("murid", initialData.email || "", initialData.userId);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: formData.nama,
          phone: formData.phone,
          email: formData.email,
          avatarUrl: formData.avatarUrl,
          kelas: formData.kelas,
          sekolah: formData.sekolah,
          namaWali: formData.namaWali,
          phoneWali: formData.phoneWali,
        }),
      });
      updateName(formData.nama);
      updateEmail(formData.email);
      // update local UI state and notify other layouts to sync instantly
      setInitialData((cur) => ({ ...cur, sekolah: formData.sekolah, namaWali: formData.namaWali, phoneWali: formData.phoneWali }));
      setFormData((cur) => ({ ...cur, sekolah: formData.sekolah, namaWali: formData.namaWali, phoneWali: formData.phoneWali }));
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("profile-murid-change", {
            detail: {
              kelas: formData.kelas,
              sekolah: formData.sekolah,
              namaWali: formData.namaWali,
              phoneWali: formData.phoneWali,
            },
          }),
        );
      }
      toast("Data profil murid berhasil diperbarui!", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan profil murid.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Profil & Pengaturan Akun</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Perbarui informasi data diri murid dan kontak wali untuk kemudahan koordinasi belajar.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar & Identitas Singkat */}
        <Card className="border-border">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <ProfileAvatarUploader
                role="murid"
                defaultAvatarUrl={initialData.avatarUrl || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"}
                name={formData.nama || initialData.nama}
                userId={initialData.userId}
                onAvatarChange={(avatarUrl) => setFormData((current) => ({ ...current, avatarUrl }))}
              />
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-bold text-foreground">{formData.nama}</h3>
                <Badge variant="default">Akun Siswa Aktif</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {getKelasLabel(formData.kelas)} • {formData.sekolah}
              </p>
              <p className="text-[11px] text-primary font-medium">
                Terdaftar sejak {initialData.createdAt ? new Date(initialData.createdAt).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form Data Murid */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Informasi Siswa</CardTitle>
            <CardDescription>Data identitas siswa yang mengikuti bimbingan belajar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nama Lengkap Siswa</label>
                <Input required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Alamat Email Siswa</label>
                <div className="flex gap-2">
                  <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  <Button type="button" variant="ghost" onClick={() => window.location.assign(`/forgot-password?email=${encodeURIComponent(formData.email || localEmail)}`)} className="whitespace-nowrap">
                    Lupa Sandi
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">No. Telepon / WhatsApp Siswa</label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Asal Sekolah</label>
                <Input value={formData.sekolah} onChange={(e) => setFormData({ ...formData, sekolah: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Kelas / Semester</label>
                <select className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm" value={formData.kelas} onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}>
                  {KELAS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Data Wali Murid */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Data Orang Tua / Wali</CardTitle>
            <CardDescription>Kontak wali untuk pengiriman laporan berkala dan tagihan SPP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nama Orang Tua / Wali</label>
                <Input value={formData.namaWali} onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">WhatsApp Orang Tua</label>
                <Input value={formData.phoneWali} onChange={(e) => setFormData({ ...formData, phoneWali: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keamanan & Sandi */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Ganti Kata Sandi (Opsional)</CardTitle>
            <CardDescription>Kosongkan bila tidak ingin mengubah kata sandi akunmu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Sandi Saat Ini</label>
                <PasswordInput placeholder="••••••••" value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Sandi Baru</label>
                <PasswordInput placeholder="Minimal 8 karakter" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="accent" size="lg" isLoading={loading} className="w-full sm:w-auto font-bold gap-2 px-8">
            <Save className="h-4 w-4" /> Simpan Perubahan Profil
          </Button>
        </div>

        <Card className="border-border border-destructive/20 bg-rose-50/40">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">Keluar dari Akun</p>
              <p className="text-xs text-muted-foreground mt-0.5">Akhiri sesi login murid di perangkat ini.</p>
            </div>
            <LogoutButton label="Logout Sekarang" className="border border-rose-200 bg-white px-4 py-2 text-rose-700 hover:bg-rose-100 hover:text-rose-800" />
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
