"use client";

import * as React from "react";
import { Save, Bell, Sliders, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { DUMMY_ADMIN } from "@/lib/dummy-data";
import { ProfileAvatarUploader, useProfileName, useProfileEmail } from "@/components/shared/ProfileAvatarUploader";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { apiFetch } from "@/lib/api";

export default function AdminPengaturanPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [profile, setProfile] = React.useState({
    name: DUMMY_ADMIN.nama,
    email: DUMMY_ADMIN.email,
    avatarUrl: DUMMY_ADMIN.avatarUrl,
    userId: undefined as string | undefined,
  });
  const { name: adminProfileName, updateName: updateAdminProfileName } = useProfileName("admin", profile.name, profile.userId);
  const { email: localAdminEmail, updateEmail: updateAdminEmail } = useProfileEmail("admin", profile.email || "", profile.userId);

  const [settings, setSettings] = React.useState({
    namaBimbel: "Helped By Dinda",
    taglinePlatform: "Bimbel Digital Modern",
    wordmarkPlatform: "Platform Belajar Modern",
    logoUrl: "/helpedd.jpeg",
    emailPlatform: "produktifdinda@gmail.com",
    emailPengirim: "noreply@helpedbydinda.id",
    whatsappHotline: "+62 812-3456-7890",
    alamatPusat: "Jl. Kemang Raya No. 45, Mampang Prapatan, Jakarta Selatan",
    defaultRatePerJam: 60000,
    toleransiMenitAbsen: 15,
    autoCronH1: true,
    autoCronH30: true,
    autoMarkAlpha: true,
    namaPribadi: adminProfileName,
    bankName: "",
    accountNumber: "",
    accountName: "",
    centerAddress: "",
    googleMapsUrl: "",
  });

  React.useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const result = await apiFetch<{ ok: boolean; user: { id: string; name: string; email?: string; avatarUrl?: string | null } }>("/api/profile");
        if (!active) return;

        setProfile({
          name: result.user.name || DUMMY_ADMIN.nama,
          email: result.user.email || DUMMY_ADMIN.email,
          avatarUrl: result.user.avatarUrl || DUMMY_ADMIN.avatarUrl,
          userId: result.user.id,
        });
      } catch {
        // Ignore and keep the default admin profile.
      }
    };

    const loadPaymentSettings = async () => {
      try {
        const result = await apiFetch<{
          ok: boolean;
          data: { bankName?: string | null; accountNumber?: string | null; accountName?: string | null; centerAddress?: string | null; googleMapsUrl?: string | null } | null;
        }>("/api/payment-settings");
        if (!active || !result.data) return;
        setSettings((current) => ({
          ...current,
          bankName: result.data?.bankName || "",
          accountNumber: result.data?.accountNumber || "",
          accountName: result.data?.accountName || "",
          centerAddress: result.data?.centerAddress || "",
          googleMapsUrl: result.data?.googleMapsUrl || "",
        }));
      } catch {
        // Keep empty payment settings when none exist.
      }
    };

    loadProfile();
    loadPaymentSettings();
    const loadSiteSettings = async () => {
      try {
        const result = await apiFetch<{
          ok: boolean;
          data: { name?: string | null; tagline?: string | null; logoUrl?: string | null; wordmark?: string | null; supportEmail?: string | null; phone?: string | null; address?: string | null } | null;
        }>("/api/site-settings");
        if (!result.data) return;
        setSettings((current) => ({
          ...current,
          namaBimbel: result.data?.name || current.namaBimbel,
          taglinePlatform: result.data?.tagline || current.taglinePlatform,
          wordmarkPlatform: result.data?.wordmark || current.wordmarkPlatform,
          logoUrl: result.data?.logoUrl || current.logoUrl,
          emailPlatform: result.data?.supportEmail || current.emailPlatform,
          whatsappHotline: result.data?.phone || current.whatsappHotline,
          alamatPusat: result.data?.address || current.alamatPusat,
        }));
      } catch {
        // ignore
      }
    };
    loadSiteSettings();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    setSettings((current) => ({ ...current, namaPribadi: adminProfileName }));
  }, [adminProfileName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const canonicalAddress = settings.centerAddress.trim() || settings.alamatPusat.trim();
    try {
      await apiFetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: settings.namaPribadi,
          email: settings.emailPengirim,
        }),
      });
      await apiFetch("/api/payment-settings", {
        method: "PUT",
        body: JSON.stringify({
          bankName: settings.bankName,
          accountNumber: settings.accountNumber,
          accountName: settings.accountName,
          centerAddress: canonicalAddress,
          googleMapsUrl: settings.googleMapsUrl,
        }),
      });
      updateAdminProfileName(settings.namaPribadi);
      updateAdminEmail(settings.emailPengirim);
      // Save site identity as well
      await apiFetch("/api/site-settings", {
        method: "PUT",
        body: JSON.stringify({
          name: settings.namaBimbel,
          tagline: settings.taglinePlatform,
          logoUrl: settings.logoUrl,
          wordmark: settings.wordmarkPlatform,
          supportEmail: settings.emailPlatform,
          phone: settings.whatsappHotline,
          address: canonicalAddress,
        }),
      });
      window.dispatchEvent(new Event("site-settings-change"));
      toast("Pengaturan sistem bimbel berhasil disimpan!", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan profil admin.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Pengaturan Sistem & Operasional</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Konfigurasi parameter global bimbel, batas toleransi presensi, dan jadwal otomasi cron.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base">Profil Administrator</CardTitle>
            <CardDescription>Tambahkan atau ganti foto profil administrator yang tampil di panel admin.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <ProfileAvatarUploader role="admin" defaultAvatarUrl={profile.avatarUrl} name={adminProfileName} userId={profile.userId} />
            <div className="text-center sm:text-left">
              <p className="font-semibold text-foreground">{adminProfileName}</p>
              <p className="text-xs text-muted-foreground">Founder & Superadmin</p>
              <p className="mt-2 text-xs text-muted-foreground">Format JPG, PNG, atau WEBP. Maksimal 3 MB.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base">Alamat & Rekening Pembayaran Murid</CardTitle>
            <CardDescription>Data ini tampil di halaman kontak publik, peta terintegrasi, dan petunjuk pembayaran murid.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Alamat Akurat Pusat Belajar (Tampil di Kontak & Maps)</label>
              <Input placeholder="Alamat Offline (Contoh: Jl. Mede No. 12, Jakarta Selatan)" value={settings.centerAddress} onChange={(e) => setSettings({ ...settings, centerAddress: e.target.value })} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Link Share Google Maps (Iframe/URL Embed)</label>
              <Input placeholder="Format URL Embed Maps atau Tautan Koordinat Maps" value={settings.googleMapsUrl} onChange={(e) => setSettings({ ...settings, googleMapsUrl: e.target.value })} />
            </div>
            <Input placeholder="Nama bank" value={settings.bankName} onChange={(e) => setSettings({ ...settings, bankName: e.target.value })} />
            <Input placeholder="Nomor rekening" value={settings.accountNumber} onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })} />
            <Input placeholder="Nama pemilik rekening" value={settings.accountName} onChange={(e) => setSettings({ ...settings, accountName: e.target.value })} />
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base">Nama Pribadi Administrator</CardTitle>
            <CardDescription>Ubah nama yang tampil di panel admin dan sidebar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Nama Lengkap Admin</label>
              <Input value={settings.namaPribadi} onChange={(e) => setSettings({ ...settings, namaPribadi: e.target.value })} placeholder="Masukkan nama pribadi admin" />
            </div>
          </CardContent>
        </Card>

        {/* Identitas Lembaga */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Identitas Platform Bimbel
            </CardTitle>
            <CardDescription>Informasi umum yang tampil pada email dan halaman publik</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nama Lembaga Bimbel</label>
                <Input value={settings.namaBimbel} onChange={(e) => setSettings({ ...settings, namaBimbel: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tagline Platform</label>
                <Input value={settings.taglinePlatform} onChange={(e) => setSettings({ ...settings, taglinePlatform: e.target.value })} placeholder="Bimbel Digital Modern" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Wordmark Logo</label>
                <Input value={settings.wordmarkPlatform} onChange={(e) => setSettings({ ...settings, wordmarkPlatform: e.target.value })} placeholder="Platform Belajar Modern" />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Logo Platform</label>
                <div className="flex flex-wrap items-center gap-3">
                  <img src={settings.logoUrl} alt="Preview logo platform" className="h-16 w-16 rounded-xl border border-border object-cover" />
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) return;
                      if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
                        toast("Logo harus berupa JPG, PNG, atau WEBP maksimal 2 MB.", "error");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === "string") setSettings((current) => ({ ...current, logoUrl: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Logo disimpan di database agar konsisten di semua aktor dan perangkat.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Pengirim Resend</label>
                <div className="flex gap-2">
                  <Input value={settings.emailPengirim} onChange={(e) => setSettings({ ...settings, emailPengirim: e.target.value })} />
                  <Button type="button" variant="ghost" onClick={() => window.location.assign(`/forgot-password?email=${encodeURIComponent(settings.emailPengirim || localAdminEmail)}`)}>
                    Lupa Sandi
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Hotline WhatsApp CS</label>
                <Input value={settings.whatsappHotline} onChange={(e) => setSettings({ ...settings, whatsappHotline: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Layanan Platform</label>
                <Input type="email" value={settings.emailPlatform} onChange={(e) => setSettings({ ...settings, emailPlatform: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Alamat Kantor Pusat</label>
                <Input value={settings.alamatPusat} onChange={(e) => setSettings({ ...settings, alamatPusat: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parameter Presensi & Fee */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sliders className="h-4 w-4 text-accent" /> Parameter Presensi & Honor
            </CardTitle>
            <CardDescription>Aturan default perhitungan fee dan pembukaan tombol absen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Default Rate Tutor Baru (Rp/jam)</label>
                <Input type="number" value={settings.defaultRatePerJam} onChange={(e) => setSettings({ ...settings, defaultRatePerJam: Number(e.target.value) })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Toleransi Waktu Presensi (Menit)</label>
                <Input type="number" value={settings.toleransiMenitAbsen} onChange={(e) => setSettings({ ...settings, toleransiMenitAbsen: Number(e.target.value) })} />
                <p className="text-[10px] text-muted-foreground">Tombol absen dibuka: [Mulai - X menit] s/d [Selesai + X menit].</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Otomasi Cron Jobs */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-purple-600" /> Otomasi Jadwal Cron Vercel
            </CardTitle>
            <CardDescription>Penjadwal pengingat otomatis di latar belakang</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card cursor-pointer hover:bg-muted/30">
              <div>
                <p className="text-xs font-bold text-foreground">Pengingat H-1 Jadwal Mengajar (Pukul 20.00 WIB)</p>
                <p className="text-[11px] text-muted-foreground">Kirim email otomatis ke seluruh tutor yang ada jadwal esok hari</p>
              </div>
              <input type="checkbox" checked={settings.autoCronH1} onChange={(e) => setSettings({ ...settings, autoCronH1: e.target.checked })} className="h-5 w-5 rounded-md accent-primary" />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card cursor-pointer hover:bg-muted/30">
              <div>
                <p className="text-xs font-bold text-foreground">Pengingat Sesi H-30 Menit (Setiap 15 Menit)</p>
                <p className="text-[11px] text-muted-foreground">Kirim email persiapan masuk ruang kelas ke murid & tutor</p>
              </div>
              <input type="checkbox" checked={settings.autoCronH30} onChange={(e) => setSettings({ ...settings, autoCronH30: e.target.checked })} className="h-5 w-5 rounded-md accent-primary" />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card cursor-pointer hover:bg-muted/30">
              <div>
                <p className="text-xs font-bold text-foreground">Marker Alpha Otomatis Harian (Pukul 23.55 WIB)</p>
                <p className="text-[11px] text-muted-foreground">Otomatis set status Alpha jika murid/tutor tidak mengisi absen sampai sesi berakhir</p>
              </div>
              <input type="checkbox" checked={settings.autoMarkAlpha} onChange={(e) => setSettings({ ...settings, autoMarkAlpha: e.target.checked })} className="h-5 w-5 rounded-md accent-primary" />
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="accent" size="lg" isLoading={loading} className="w-full sm:w-auto font-bold gap-2 px-8">
            <Save className="h-4 w-4" /> Simpan Pengaturan
          </Button>
        </div>

        <Card className="border-border border-destructive/20 bg-rose-50/40">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">Keluar dari Akun Admin</p>
              <p className="text-xs text-muted-foreground mt-0.5">Akhiri sesi login administrator di perangkat ini.</p>
            </div>
            <LogoutButton label="Logout Sekarang" className="border border-rose-200 bg-white px-4 py-2 text-rose-700 hover:bg-rose-100 hover:text-rose-800" />
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
