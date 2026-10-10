"use client";

import * as React from "react";
import { Coins, Clock, Calendar, CheckCircle2, AlertCircle, FileText, ArrowRight, Printer, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { apiFetch } from "@/lib/api";
import * as ApiTypes from "@/types/api";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { useVisiblePolling } from "@/lib/use-visible-polling";
import { Download, FileCheck, Receipt } from "lucide-react";
import { Users } from "lucide-react";

type AttendanceRow = {
  id: string;
  tanggal: string;
  mataPelajaran: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  kelasGroup: string | null;
  mode: "ONLINE" | "OFFLINE";
  rate: number;
};

type PayoutRow = {
  id: string;
  periodType: string;
  periodKey: string;
  periodLabel: string | null;
  periodStart: string;
  periodEnd: string;
  totalJam: number;
  nominalPerJam: number;
  totalFee: number;
  manualTotalFee: number | null;
  status: "PENDING" | "PAID";
  paidAt: string | null;
  payoutMethod: string | null;
  payoutReference: string | null;
};

type KelasFeeRow = {
  id: string;
  namaKelas: string;
  program: string;
  jenjang: string;
  metode: string;
  jenisKelas: string;
  jumlahSiswa: number;
  feePerSiswa: number;
  totalFee: number;
};

export default function PengajarFeePage() {
  const [feeCurrent, setFeeCurrent] = React.useState<ApiTypes.FeeRow | null>(null);
  const [payouts, setPayouts] = React.useState<PayoutRow[]>([]);
  const [teachingSessions, setTeachingSessions] = React.useState<AttendanceRow[]>([]);
  const [profile, setProfile] = React.useState({ nominalPerJam: 0, ratePerSession: 0, rateSessions: [] as { kelasGroup: string; mode: "ONLINE" | "OFFLINE"; rate: number }[] });
  const [rateSessions, setRateSessions] = React.useState<{ kelasGroup: string; mode: "ONLINE" | "OFFLINE"; rate: number }[]>([]);
  const [previewProof, setPreviewProof] = React.useState<{ name: string; url: string; mimeType: string | null } | null>(null);
  const [liveSummary, setLiveSummary] = React.useState({ periode: "", totalJam: 0, totalFee: 0 });
  const [kelasBulanan, setKelasBulanan] = React.useState<KelasFeeRow[]>([]);
  const [feeKelasBulanan, setFeeKelasBulanan] = React.useState(0);
  const [jumlahSiswaKelas, setJumlahSiswaKelas] = React.useState(0);
  const [monthlyStatus, setMonthlyStatus] = React.useState("PENDING");
  const [paymentProof, setPaymentProof] = React.useState<{ data: string | null; name: string | null; mimeType: string | null }>({ data: null, name: null, mimeType: null });

  // Invoice state
  type InvoiceRow = { id: string; title?: string | null; periode?: string | null; fileName?: string | null; createdAt?: string | null };
  const [invoices, setInvoices] = React.useState<InvoiceRow[]>([]);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const loadInvoices = React.useCallback(async () => {
    try {
      const res = await apiFetch<{ ok: boolean; data: InvoiceRow[] }>("/api/invoice");
      setInvoices(res.data || []);
    } catch {}
  }, []);

  const downloadInvoice = async (id: string, name: string) => {
    setDownloadingId(id);
    try {
      const res = await apiFetch<{ ok: boolean; data: { fileData: string; fileName: string } }>("/api/invoice", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      if (res.ok && res.data.fileData) {
        const link = document.createElement("a");
        link.href = res.data.fileData;
        link.download = res.data.fileName || name || "invoice.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const loadFeeData = React.useCallback(async () => {
    try {
      const [feeRes, profileRes] = await Promise.all([
        apiFetch<{
          ok: boolean;
          data: ApiTypes.FeeRow[];
          attendance: AttendanceRow[];
          payouts: PayoutRow[];
          ratePerSession: number;
          rateSessions: { kelasGroup: string; mode: "ONLINE" | "OFFLINE"; rate: number }[];
          currentPeriod: string;
          totalJam: number;
          totalFee: number;
          feeKelasBulanan?: number;
          kelasBulanan?: KelasFeeRow[];
          jumlahSiswaKelas?: number;
          monthlyStatus?: string;
          monthlyPaidAt?: string | null;
          paymentProofData?: string | null;
          paymentProofName?: string | null;
          paymentProofMimeType?: string | null;
        }>(`/api/profile/fee?periode=${new Date().toISOString().slice(0, 7)}`),
        apiFetch<{ ok: boolean; user: { pengajar: { nominalPerJam: number } | null } }>("/api/profile"),
      ]);
      setFeeCurrent(feeRes.data?.[0] || null);
      setPayouts(feeRes.payouts || []);
      setTeachingSessions(feeRes.attendance || []);
      setLiveSummary({
        periode: feeRes.currentPeriod || new Date().toISOString().slice(0, 7),
        totalJam: feeRes.totalJam ?? feeRes.data?.[0]?.totalJam ?? 0,
        totalFee: feeRes.totalFee ?? feeRes.data?.[0]?.totalFee ?? 0,
      });
      setKelasBulanan(feeRes.kelasBulanan || []);
      setFeeKelasBulanan(feeRes.feeKelasBulanan || 0);
      setJumlahSiswaKelas(feeRes.jumlahSiswaKelas || 0);
      setMonthlyStatus(feeRes.monthlyStatus || "PENDING");
      setPaymentProof({
        data: feeRes.paymentProofData || feeRes.data?.[0]?.paymentProofData || null,
        name: feeRes.paymentProofName || feeRes.data?.[0]?.paymentProofName || null,
        mimeType: feeRes.paymentProofMimeType || feeRes.data?.[0]?.paymentProofMimeType || null,
      });
      setProfile({
        nominalPerJam: profileRes.user.pengajar?.nominalPerJam || feeRes.data?.[0]?.nominalPerJam || 0,
        ratePerSession: feeRes.ratePerSession || profileRes.user.pengajar?.nominalPerJam || 0,
        rateSessions: feeRes.rateSessions || [],
      });
      setRateSessions(feeRes.rateSessions || []);
      await loadInvoices();
    } catch {
      // Keep the last successful fee snapshot if a feed is temporarily unavailable.
    }
  }, [loadInvoices]);
  React.useEffect(() => {
    void loadFeeData();
  }, [loadFeeData]);
  useVisiblePolling(loadFeeData, 30000);

  return (
    <div id="fee-report" className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print-report-header">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Rekap Fee & Gaji Mengajar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Perhitungan fee mengajar diakumulasikan secara otomatis dari presensi kehadiran mengajar yang valid.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => window.print()} className="print-hidden">
          <Printer className="h-4 w-4" />
          Cetak / Simpan PDF
        </Button>
      </div>

      {/* Main Fee Summary Card */}
      <Card className="border-2 border-emerald-400/40 bg-linear-to-br from-emerald-50/40 via-card to-card shadow-sm">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-primary text-white">Periode: {liveSummary.periode || feeCurrent?.periode}</Badge>
              <Badge variant={monthlyStatus === "PAID" ? "success" : "warning"}>
                {monthlyStatus === "PAID" ? "SUDAH DITRANSFER" : "MENUNGGU PEMBAYARAN ADMIN"}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">Diperbarui real-time dari absensi • Cut-off: akhir bulan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 rounded-2xl bg-card border border-border">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Jumlah Siswa Aktif</p>
              <h3 className="text-3xl font-black text-foreground tabular-nums mt-1">{jumlahSiswaKelas} Siswa</h3>
              <p className="text-[11px] text-emerald-600 mt-1">Berdasarkan data kelas yang diampu (admin)</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-medium">Fee Rata-rata / Siswa / Bulan</p>
              <h3 className="text-3xl font-black text-primary tabular-nums mt-1">{formatRupiah(jumlahSiswaKelas > 0 ? Math.round(feeKelasBulanan / jumlahSiswaKelas) : 0)}</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Sesuai skema fee yang ditetapkan admin</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Fee Bulanan (Skema Admin)</p>
              <h3 className="text-3xl font-black text-emerald-700 tabular-nums mt-1">{formatRupiah(liveSummary.totalFee)}</h3>
              <p className="text-[11px] text-muted-foreground mt-1">{monthlyStatus === "PAID" ? "Sudah disalurkan" : "Akan dibayarkan tgl 5 bulan depan"}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">* Fee bulanan dihitung berdasarkan jumlah siswa aktif × fee per siswa per bulan yang ditetapkan admin. Status pembayaran tersinkronasi dengan rekap admin secara real-time.</p>
          {rateSessions.length > 0 && (
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-bold text-foreground">Tarif Sesi per Jenjang & Mode (atur admin)</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {rateSessions.map((rate) => (
                  <span key={`${rate.kelasGroup}-${rate.mode}`} className="rounded-lg bg-card border border-border px-2 py-1 text-[10px] font-semibold text-foreground tabular-nums">
                    {rate.kelasGroup.replace("_SMK", "/SMK")} • {rate.mode === "ONLINE" ? "Online" : "Offline"}: {formatRupiah(rate.rate)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {paymentProof.data && (
            <button
              type="button"
              onClick={() => setPreviewProof({ name: paymentProof.name || "Bukti Pembayaran", url: paymentProof.data!, mimeType: paymentProof.mimeType })}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" /> Pratinjau Bukti Pembayaran Fee{paymentProof.name ? ` (${paymentProof.name})` : ""}
            </button>
          )}
        </CardContent>
      </Card>

      {/* Rincian Fee Bulanan per Kelas (sync met admin Kelola Kelas & Fee) */}
      {kelasBulanan.length > 0 && (
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Rincian Fee Bulanan per Kelas
              <Badge variant="default" className="text-[10px]">Sync Admin</Badge>
            </CardTitle>
            <CardDescription>Fee bulanan dihitung dari jumlah siswa aktif per kelas × nominal fee per siswa per bulan (ditetapkan oleh admin).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-border bg-muted/20 p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-muted-foreground">Jumlah Kelas Diampu</p>
                <p className="text-xl font-black text-foreground tabular-nums">{kelasBulanan.length}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Total Fee Bulanan (Kelas & Fee Admin)</p>
                <p className="text-xl font-black text-emerald-700 tabular-nums">{formatRupiah(feeKelasBulanan)}</p>
              </div>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase font-semibold text-muted-foreground bg-muted/30">
                  <tr>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Jenjang / Program</th>
                    <th className="py-3 px-4">Metode / Tipe</th>
                    <th className="py-3 px-4 text-right">Siswa Aktif</th>
                    <th className="py-3 px-4 text-right">Fee / Siswa / Bulan</th>
                    <th className="py-3 px-4 text-right">Total / Kelas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {kelasBulanan.map((kelas) => (
                    <tr key={kelas.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">{kelas.namaKelas}</td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">{kelas.jenjang.replace("_", "/")} · {kelas.program}</td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">{kelas.metode} · {kelas.jenisKelas === "PRIVATE" ? "Private" : "Group"}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-foreground tabular-nums">{kelas.jumlahSiswa}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-foreground tabular-nums">{formatRupiah(kelas.feePerSiswa)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700 tabular-nums">{formatRupiah(kelas.totalFee)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border bg-muted/30">
                  <tr>
                    <td colSpan={5} className="py-3 px-4 font-bold text-foreground">Total Fee Bulanan</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700 tabular-nums">{formatRupiah(feeKelasBulanan)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {kelasBulanan.map((kelas) => (
                <div key={kelas.id} className="rounded-2xl border border-border p-4 space-y-2 bg-card">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground">{kelas.namaKelas}</h4>
                    <Badge variant={kelas.jenisKelas === "PRIVATE" ? "secondary" : "default"}>{kelas.jenisKelas === "PRIVATE" ? "Private" : "Group"}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{kelas.jenjang.replace("_", "/")} · {kelas.program} · {kelas.metode}</p>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border text-muted-foreground">
                    <span>{kelas.jumlahSiswa} siswa × {formatRupiah(kelas.feePerSiswa)}</span>
                    <span className="font-bold text-emerald-700 tabular-nums">{formatRupiah(kelas.totalFee)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histori Tracking Fee (Weekly / Custom) */}
      {payouts.length > 0 && (
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg">Histori Pelacakan Fee (Mingguan / Periode Khusus)</CardTitle>
            <CardDescription>Rekap fee yang disinkronkan dari admin untuk periode mingguan dan periode khusus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase font-semibold text-muted-foreground bg-muted/30">
                  <tr>
                    <th className="py-3 px-4">Periode</th>
                    <th className="py-3 px-4">Jam</th>
                    <th className="py-3 px-4">Nominal/Sesi</th>
                    <th className="py-3 px-4">Total Fee</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Dibayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground text-xs">
                        {payout.periodLabel || `${payout.periodType === "WEEKLY" ? "Mingguan" : "Periode Khusus"} ${payout.periodKey}`}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold tabular-nums">{payout.totalJam}</td>
                      <td className="py-3.5 px-4 text-xs tabular-nums">{formatRupiah(payout.nominalPerJam)}</td>
                      <td className="py-3.5 px-4 text-xs font-bold text-emerald-700 tabular-nums">
                        {formatRupiah(payout.manualTotalFee ?? payout.totalFee)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={payout.status === "PAID" ? "success" : "warning"}>
                          {payout.status === "PAID" ? "SUDAH DIBAYAR" : "MENUNGGU"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">{payout.paidAt ? formatDateIndo(payout.paidAt) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rincian Sesi Kehadiran yang Dihitung */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg">Rincian Sesi yang Masuk Perhitungan Fee</CardTitle>
          <CardDescription>Audit log presensi mengajar yang membentuk total jam di bulan ini</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase font-semibold text-muted-foreground bg-muted/30">
                <tr>
                  <th className="py-3 px-4">Tanggal Sesi</th>
                  <th className="py-3 px-4">Mata Pelajaran</th>
                  <th className="py-3 px-4">Durasi Sesi</th>
                  <th className="py-3 px-4">Nilai Sesi</th>
                  <th className="py-3 px-4">Status Presensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {teachingSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground">{formatDateIndo(session.tanggal)}</td>
                    <td className="py-3.5 px-4 font-medium text-foreground">{session.mataPelajaran}</td>
                    <td className="py-3.5 px-4 text-xs font-mono font-bold text-foreground">{session.startedAt && session.finishedAt ? "Selesai" : "Belum selesai"}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-700 tabular-nums">{formatRupiah(session.rate || profile.ratePerSession || profile.nominalPerJam)}</span>
                      {session.kelasGroup && <span className="block text-[10px] text-muted-foreground font-medium">{session.kelasGroup} • {session.mode === "ONLINE" ? "Online" : "Offline"}</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="success">HADIR (VALID)</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {teachingSessions.map((session) => (
              <div key={session.id} className="rounded-2xl border border-border p-4 space-y-2 bg-card shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{formatDateIndo(session.tanggal)}</span>
                  <Badge variant="success">VALID</Badge>
                </div>
                <h4 className="font-bold text-sm text-foreground">{session.mataPelajaran}</h4>
                <div className="flex items-center justify-between pt-1 border-t border-border text-xs">
                  <span className="text-muted-foreground">{session.startedAt && session.finishedAt ? "Selesai" : "Belum selesai"}</span>
                  <span className="font-bold text-emerald-700 tabular-nums">{formatRupiah(session.rate || profile.ratePerSession || profile.nominalPerJam)}</span>
                  {session.kelasGroup && <span className="block text-[10px] text-muted-foreground font-medium">{session.kelasGroup} • {session.mode === "ONLINE" ? "Online" : "Offline"}</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={previewProof !== null} onClose={() => setPreviewProof(null)} title="Pratinjau Bukti Pembayaran" description={previewProof?.name} className="max-w-2xl">
        <div className="mt-4 flex flex-col items-center justify-center border border-border rounded-2xl bg-muted/40 p-4 min-h-75">
          {previewProof?.mimeType === "application/pdf" ? (
            <iframe src={previewProof.url} className="w-full h-[50vh] rounded-xl border border-border" title="PDF Preview" />
          ) : previewProof?.url ? (
            <img src={previewProof.url} alt={previewProof.name} className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-xs" />
          ) : (
            <p className="text-xs text-muted-foreground">Tidak dapat menampilkan pratinjau.</p>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {previewProof?.url && (
            <a href={previewProof.url} download={previewProof.name} className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted transition">
              Unduh File
            </a>
          )}
          <Button variant="ghost" onClick={() => setPreviewProof(null)}>
            Tutup
          </Button>
        </div>
      </Modal>
    </div>
  );
}
