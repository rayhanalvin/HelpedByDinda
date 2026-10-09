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

type AttendanceRow = {
  id: string;
  tanggal: string;
  mataPelajaran: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
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

export default function PengajarFeePage() {
  const [feeCurrent, setFeeCurrent] = React.useState<ApiTypes.FeeRow | null>(null);
  const [payouts, setPayouts] = React.useState<PayoutRow[]>([]);
  const [teachingSessions, setTeachingSessions] = React.useState<AttendanceRow[]>([]);
  const [profile, setProfile] = React.useState({ nominalPerJam: 0 });
  const [previewProof, setPreviewProof] = React.useState<{ name: string; url: string; mimeType: string | null } | null>(null);

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
        apiFetch<{ ok: boolean; data: ApiTypes.FeeRow[]; attendance: AttendanceRow[]; payouts: PayoutRow[] }>(`/api/profile/fee?periode=${new Date().toISOString().slice(0, 7)}`),
        apiFetch<{ ok: boolean; user: { pengajar: { nominalPerJam: number } | null } }>("/api/profile"),
      ]);
      setFeeCurrent(feeRes.data?.[0] || null);
      setPayouts(feeRes.payouts || []);
      setTeachingSessions(feeRes.attendance || []);
      setProfile({ nominalPerJam: profileRes.user.pengajar?.nominalPerJam || feeRes.data?.[0]?.nominalPerJam || 0 });
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
              <Badge variant="default" className="bg-primary text-white">
                Periode: {feeCurrent?.periode || "2025-07"}
              </Badge>
              <Badge variant={feeCurrent?.status === "PAID" || feeCurrent?.status === "dibayar" ? "success" : "warning"}>
                {feeCurrent?.status === "PAID" || feeCurrent?.status === "dibayar" ? "SUDAH DITRANSFER" : "MENUNGGU PEMBAYARAN ADMIN"}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">Cut-off fee: Akhir bulan kalender</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 rounded-2xl bg-card border border-border">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Jam Mengajar</p>
              <h3 className="text-3xl font-black text-foreground tabular-nums mt-1">{feeCurrent?.totalJam || 42} Jam</h3>
              <p className="text-[11px] text-emerald-600 mt-1">Presensi hadir terverifikasi</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-medium">Tarif Rate Per Jam</p>
              <h3 className="text-3xl font-black text-primary tabular-nums mt-1">{formatRupiah(profile.nominalPerJam)}</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Rate Tutor Matematika SMA</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Fee Terhitung</p>
              <h3 className="text-3xl font-black text-emerald-700 tabular-nums mt-1">{feeCurrent ? formatRupiah(feeCurrent.totalFee) : "Rp 0"}</h3>
              <p className="text-[11px] text-muted-foreground mt-1">{feeCurrent?.status === "dibayar" ? "Sudah disalurkan" : "Akan dibayarkan tgl 5 bulan depan"}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">* Perhitungan fee hanya menghitung sesi dengan status **Hadir** atau **Terlambat**. Sesi berstatus Izin, Sakit, atau Alpha tidak masuk ke dalam perhitungan jam mengajar.</p>
          {feeCurrent?.paymentProofData && (
            <button
              type="button"
              onClick={() => setPreviewProof({ name: feeCurrent.paymentProofName || "Bukti Pembayaran", url: feeCurrent.paymentProofData!, mimeType: feeCurrent.paymentProofMimeType || null })}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" /> Pratinjau Bukti Pembayaran Fee{feeCurrent.paymentProofName ? ` (${feeCurrent.paymentProofName})` : ""}
            </button>
          )}
        </CardContent>
      </Card>

      {/* Histori Tracking Fee (Weekly / Custom) */}
      {payouts.length > 0 && (
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg">Histori Tracking Fee (Mingguan / Kustom)</CardTitle>
            <CardDescription>Rekap fee yang disinkronisasi dari admin untuk periode mingguan dan kustom</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase font-semibold text-muted-foreground bg-muted/30">
                  <tr>
                    <th className="py-3 px-4">Periode</th>
                    <th className="py-3 px-4">Jam</th>
                    <th className="py-3 px-4">Nominal/Jam</th>
                    <th className="py-3 px-4">Total Fee</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Dibayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground text-xs">
                        {payout.periodLabel || `${payout.periodType} ${payout.periodKey}`}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold tabular-nums">{payout.totalJam}</td>
                      <td className="py-3.5 px-4 text-xs tabular-nums">{formatRupiah(payout.nominalPerJam)}</td>
                      <td className="py-3.5 px-4 text-xs font-bold text-emerald-700 tabular-nums">
                        {formatRupiah(payout.manualTotalFee ?? payout.totalFee)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={payout.status === "PAID" ? "success" : "warning"}>
                          {payout.status === "PAID" ? "DIBYAR" : "PENDING"}
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
                    <td className="py-3.5 px-4 font-bold text-emerald-700 tabular-nums">{formatRupiah(profile.nominalPerJam)}</td>
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
                  <span className="font-bold text-emerald-700 tabular-nums">{formatRupiah(profile.nominalPerJam)}</span>
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
