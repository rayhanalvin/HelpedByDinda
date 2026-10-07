"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatRupiah } from "@/lib/utils";
import { ProfileAvatarUploader, useProfileName, useProfileEmail } from "@/components/shared/ProfileAvatarUploader";
import { apiFetch } from "@/lib/api";
import { PasswordInput } from "@/components/shared/PasswordInput";

export default function PengajarProfilPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [initialData, setInitialData] = React.useState({
    nama: "",
    email: "",
    phone: "",
    spesialisasi: "",
    bio: "",
    avatarUrl: "",
    nominalPerJam: 75000,
    userId: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
  });

  const [formData, setFormData] = React.useState({
    nama: "",
    email: "",
    phone: "",
    spesialisasi: "",
    bio: "",
    avatarUrl: "",
    currentPassword: "",
    newPassword: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
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
            pengajar?: { spesialisasi?: string | null; bio?: string | null; nominalPerJam?: number | null; bankName?: string | null; bankAccountNumber?: string | null; bankAccountName?: string | null } | null;
          };
        }>("/api/profile");
        const user = result.user;
        const next = {
          nama: user.name,
          email: user.email,
          phone: user.phone || "",
          spesialisasi: user.pengajar?.spesialisasi || "Belum diatur",
          bio: user.pengajar?.bio || "",
          avatarUrl: user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          nominalPerJam: user.pengajar?.nominalPerJam || 0,
          userId: user.id,
          bankName: user.pengajar?.bankName || "",
          bankAccountNumber: user.pengajar?.bankAccountNumber || "",
          bankAccountName: user.pengajar?.bankAccountName || "",
        };
        setInitialData(next);
        setFormData({ ...next, avatarUrl: next.avatarUrl, currentPassword: "", newPassword: "" });
      } catch (error) {
        toast(error instanceof Error ? error.message : "Gagal memuat profil pengajar.", "error");
      }
    };

    loadProfile();
  }, [toast]);

  const { updateName } = useProfileName("pengajar", initialData.nama || "Pengajar", initialData.userId);
  const { email: localEmail, updateEmail } = useProfileEmail("pengajar", initialData.email || "", initialData.userId);

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
          spesialisasi: formData.spesialisasi,
          bio: formData.bio,
        }),
      });
      await apiFetch("/api/profile/payout", {
        method: "PUT",
        body: JSON.stringify({
          bankName: formData.bankName,
          bankAccountNumber: formData.bankAccountNumber,
          bankAccountName: formData.bankAccountName,
        }),
      });
      updateName(formData.nama);
      updateEmail(formData.email);
      toast("Profil pengajar dan bio berhasil diperbarui!", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan profil pengajar.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Profil & Pengaturan Tutor</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Kelola bio pengajar dan informasi kontak yang tampil pada platform publik Helped By Dinda.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar & Header */}
        <Card className="border-border">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <ProfileAvatarUploader
                role="pengajar"
                defaultAvatarUrl={initialData.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"}
                name={formData.nama || initialData.nama}
                userId={initialData.userId}
                onAvatarChange={(avatarUrl) => setFormData((current) => ({ ...current, avatarUrl }))}
              />
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-bold text-foreground">{formData.nama}</h3>
                <Badge variant="success">Tutor Terverifikasi</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{formData.spesialisasi}</p>
              <p className="text-xs font-bold text-emerald-700 mt-1">Rate Mengajar: {formatRupiah(initialData.nominalPerJam)} / jam</p>
            </div>
          </CardContent>
        </Card>

        {/* Data Diri & Bio */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Informasi Biodata Pengajar</CardTitle>
            <CardDescription>Bio ini ditampilkan pada halaman publik bimbel untuk calon murid</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nama Lengkap & Gelar</label>
                <Input required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Alamat Email</label>
                <div className="flex gap-2">
                  <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  <Button type="button" variant="ghost" onClick={() => window.location.assign(`/forgot-password?email=${encodeURIComponent(formData.email || localEmail)}`)} className="whitespace-nowrap">
                    Lupa Sandi
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nomor WhatsApp</label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Bidang Spesialisasi</label>
                <Input value={formData.spesialisasi} onChange={(e) => setFormData({ ...formData, spesialisasi: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Bio Singkat Pengajar</label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full rounded-xl border border-input bg-card p-3.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <div>
                <p className="text-sm font-bold text-foreground">Rekening Penerimaan Fee</p>
                <p className="text-xs text-muted-foreground">Data ini digunakan admin saat membayar honor dan tersimpan pada tracking finance.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input placeholder="Nama bank" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} />
                <Input placeholder="Nomor rekening" value={formData.bankAccountNumber} onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })} />
                <Input placeholder="Nama pemilik rekening" value={formData.bankAccountName} onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ganti Sandi */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Ganti Kata Sandi (Opsional)</CardTitle>
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
            <Save className="h-4 w-4" /> Simpan Profil Pengajar
          </Button>
        </div>
      </form>
    </div>
  );
}
