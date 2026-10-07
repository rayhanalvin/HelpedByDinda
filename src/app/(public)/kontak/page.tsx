"use client";

import * as React from "react";
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, CheckCircle2, Bot, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useSiteSettings } from "@/components/shared/BrandLogo";
import { toEmbedUrl, extractIframeSrc } from "@/lib/maps";

const WHATSAPP_HOTLINE = "082381188058";

type PortalContactContent = { judul: string; ringkasan: string | null; isi: string };
type PaymentSettingsResponse = {
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  centerAddress: string | null;
  centerLat: number | null;
  centerLng: number | null;
  googleMapsUrl: string | null;
};

export default function KontakPage() {
  const { toast } = useToast();
  const { site } = useSiteSettings();
  const [portalContent, setPortalContent] = React.useState<PortalContactContent | null>(null);
  const [paymentSettings, setPaymentSettings] = React.useState<PaymentSettingsResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [receipt, setReceipt] = React.useState<{ id: string; hotline: string } | null>(null);
  const [formData, setFormData] = React.useState({
    nama: "",
    email: "",
    whatsapp: "",
    jenjang: "SMA",
    pesan: "",
  });

  const centerAddress = paymentSettings?.centerAddress || site.address || "";
  const centerQuery =
    paymentSettings?.centerLat !== null && paymentSettings?.centerLat !== undefined && paymentSettings?.centerLng !== null && paymentSettings?.centerLng !== undefined
      ? `${paymentSettings.centerLat},${paymentSettings.centerLng}`
      : centerAddress;
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(centerQuery || "Pusat Belajar Helped By Dinda, Indonesia")}`;

  React.useEffect(() => {
    fetch("/api/portal/kontak")
      .then((response) => response.json())
      .then((result) => setPortalContent(result.data || null))
      .catch(() => setPortalContent(null));

    fetch("/api/payment-settings")
      .then((response) => response.json())
      .then((result) => setPaymentSettings(result.data || null))
      .catch(() => setPaymentSettings(null));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then(async (res) => {
        setLoading(false);
        if (res.ok) {
          const json = await res.json().catch(() => null);
          // show chatbot-like receipt modal and redirect to admin WhatsApp hotline
          const rawHotline = WHATSAPP_HOTLINE;
          const hotlineDigits = rawHotline.replace(/[^0-9]/g, "");
          const hotline = hotlineDigits.startsWith("0") ? `62${hotlineDigits.slice(1)}` : hotlineDigits;
          const encoded = encodeURIComponent(`Halo Admin, saya ${formData.nama} (${formData.whatsapp}). Saya tertarik pada jenjang ${formData.jenjang}: ${formData.pesan}`);
          const waUrl = `https://wa.me/${hotline.replace(/[^0-9]/g, "")}?text=${encoded}`;
          // small delay to let user see toast then open whatsapp
          toast("Pesan terkirim. Mengarahkan ke WhatsApp hotline…", "success");
          setReceipt({ id: json?.data?.id || `LOCAL-${Date.now()}`, hotline });
          setFormData({ nama: "", email: "", whatsapp: "", jenjang: "SMA", pesan: "" });
          // open whatsapp in a new tab/window
          window.open(waUrl, "_blank");
        } else {
          const json = await res.json().catch(() => null);
          toast(json?.message || "Gagal mengirim pesan. Coba lagi nanti.", "error");
        }
      })
      .catch(() => {
        setLoading(false);
        toast("Gagal mengirim pesan. Periksa koneksi internet Anda.", "error");
      });
  };

  return (
    <div className="flex flex-col gap-12 py-12 pb-24">
      {/* Header */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 text-center">
        <Badge variant="default" className="mb-3">
          Hubungi Tim Kami
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">{portalContent?.judul || "Ada Pertanyaan Seputar Program Belajar?"}</h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {portalContent?.ringkasan || "Jangan ragu untuk berkonsultasi. Tim akademik Helped By Dinda siap membantu menentukan program dan tutor yang paling tepat."}
        </p>
      </section>

      {/* Main Form & Contact Info */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-border">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Informasi Layanan</h3>
                  <p className="text-xs text-muted-foreground mt-1">{portalContent?.isi || "Silakan hubungi kami melalui saluran resmi berikut:"}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">WhatsApp Hotline (Cepat)</p>
                      <p className="text-sm font-bold text-foreground">082381188058</p>
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">Online • Respon rata-rata 10 menit</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Email Dukungan & Pendaftaran</p>
                      <p className="text-sm font-bold text-foreground">cs.helpeddinda@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Pusat Belajar Offline</p>
                      <p className="text-sm font-bold text-foreground">{centerAddress || "Alamat pusat belajar belum diatur"}</p>
                      <p className="text-xs text-muted-foreground mt-1">Dekat Dengan STIE Bhakti Pembangunan</p>
                      <a href={googleMapsLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                        Buka lokasi di Google Maps <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Jam Operasional Layanan</p>
                      <p className="text-sm font-bold text-foreground">Senin – Jumat: 08.00 – 22.00 WIB</p>
                      <p className="text-xs text-muted-foreground">Minggu & Libur Nasional: Tutup</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <Card className="border-border">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground">Kirim Formulir Konsultasi</h3>
                  <p className="text-xs text-muted-foreground mt-1">Isi formulir di bawah ini dan kami akan segera menghubungi nomor WhatsApp Anda.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Nama Lengkap Siswa / Wali</label>
                      <Input required placeholder="Contoh: Hendra Maulana" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Alamat Email</label>
                      <Input type="email" required placeholder="nama@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">No. WhatsApp Aktif</label>
                      <Input required placeholder="0812xxxxxxxx" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Jenjang yang Diminati</label>
                      <select
                        className="flex h-11 w-full rounded-xl border border-input bg-card px-4 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        value={formData.jenjang}
                        onChange={(e) => setFormData({ ...formData, jenjang: e.target.value })}
                      >
                        <option value="SD">Sekolah Dasar (SD Kelas 1-6)</option>
                        <option value="SMP">Sekolah Menengah Pertama (SMP Kelas 7-9)</option>
                        <option value="SMA">Sekolah Menengah Atas (SMA Kelas 10-12)</option>
                        <option value="UTBK">Intensif UTBK SNBT / Gap Year</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Pesan atau Pertanyaan Khusus</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Ceritakan kendala belajar putra/putri Anda atau tanyakan jadwal yang tersedia..."
                      className="w-full rounded-xl border border-input bg-card p-4 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={formData.pesan}
                      onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                    />
                  </div>

                  <Button type="submit" variant="accent" isLoading={loading} className="w-full sm:w-auto font-bold gap-2">
                    <Send className="h-4 w-4" />
                    Kirim Pesan Sekarang
                  </Button>
                </form>

                {receipt && (
                  <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-primary/5 shadow-sm">
                    <div className="flex items-start gap-3 border-b border-emerald-100 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-900">Konsultasi berhasil diterima</p>
                        <p className="mt-1 text-xs leading-relaxed text-emerald-800">Tiket {receipt.id.slice(0, 12)} sudah tercatat. WhatsApp hotline admin telah dibuka untuk melanjutkan konsultasi.</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <span className="text-xs font-semibold text-muted-foreground">Admin akan merespons melalui WhatsApp.</span>
                      <a href={`https://wa.me/${receipt.hotline}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                        <ExternalLink className="h-3.5 w-3.5" /> Buka WhatsApp Lagi
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Google Maps Integration Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="border-border overflow-hidden rounded-3xl">
          <div className="p-6 sm:p-8 bg-card border-b border-border">
            <h3 className="text-xl font-bold text-foreground">Lokasi Pusat Belajar Kami</h3>
            <p className="text-xs text-muted-foreground mt-1">Kunjungi alamat fisik kami untuk konsultasi tatap muka langsung.</p>
          </div>
          <div className="w-full h-100 relative bg-muted flex items-center justify-center">
            {(() => {
              const address = paymentSettings?.centerAddress || site.address || undefined;
              const hasCoordinates = typeof paymentSettings?.centerLat === "number" && typeof paymentSettings?.centerLng === "number";
              // Combine coordinates, street name, and place title so people see the exact street name and marker
              const urlMarkerQuery = hasCoordinates && address ? `${paymentSettings.centerLat},${paymentSettings.centerLng} (${address})` : hasCoordinates ? `${paymentSettings.centerLat},${paymentSettings.centerLng}` : null;
              const input = urlMarkerQuery || paymentSettings?.googleMapsUrl || address || null;
              const iframeSrc = extractIframeSrc(input);
              const src = iframeSrc || toEmbedUrl(input, address);
              return <iframe src={src} className="w-full h-full border-0" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Google Maps" />;
            })()}
          </div>
        </Card>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-8">
          <Badge variant="default">FAQ</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-2">Pertanyaan yang Sering Diajukan</h2>
        </div>

        <div className="space-y-4">
          <Card className="border-border">
            <CardContent className="p-5">
              <h4 className="font-bold text-foreground text-sm">Bagaimana cara kerja absensi di Helped By Dinda?</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Setiap murid dan pengajar memiliki akses tombol presensi mandiri di portal mereka. Tombol akan aktif sesuai jadwal kelas. Bila hadir di luar batas toleransi waktu, sistem mencatat keterlambatan secara otomatis.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-5">
              <h4 className="font-bold text-foreground text-sm">Metode pembayaran apa saja yang didukung?</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Pembayaran bimbingan dilakukan melalui transfer bank dan dikonfirmasi oleh admin.</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-5">
              <h4 className="font-bold text-foreground text-sm">Apakah bisa mengganti pengajar jika dirasa kurang cocok?</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Tentu saja. Kepuasan belajar murid adalah prioritas utama kami. Anda dapat mengajukan permohonan pergantian tutor kepada Admin akademik kapan saja.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
