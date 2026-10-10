"use client";

import * as React from "react";
import { CheckCircle2, Coins, Printer, RefreshCw, Upload, ExternalLink, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatRupiah } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type FeeRow = {
  id: string;
  pengajarNama: string;
  totalJam: number;
  nominalPerJam: number;
  ratePerSession?: number;
  rateSessions?: { kelasGroup: string; mode: "ONLINE" | "OFFLINE"; rate: number }[];
  totalFee: number;
  periode: string;
  status: "PENDING" | "PAID";
  teacherBankName: string | null;
  teacherAccountNumber: string | null;
  teacherAccountName: string | null;
  payoutReference: string | null;
  paidAt: string | null;
  paymentProofData: string | null;
  paymentProofName: string | null;
  paymentProofMimeType: string | null;
  periodType?: "WEEKLY" | "MONTHLY" | "CUSTOM";
  periodKey?: string;
  periodLabel?: string | null;
  manualTotalFee?: number | null;
  totalFeeKelasBulanan?: number;
  jumlahKelasDiampu?: number;
};

type FeePeriodType = "MONTHLY" | "WEEKLY" | "CUSTOM";

export default function AdminFeePage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<FeeRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [trackingDate, setTrackingDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [previewProof, setPreviewProof] = React.useState<{ name: string; url: string; mimeType: string | null } | null>(null);
  const periode = trackingDate.slice(0, 7);
  const [viewType, setViewType] = React.useState<FeePeriodType>("MONTHLY");
  const [customStart, setCustomStart] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [manualNominal, setManualNominal] = React.useState("");
  const [manualTotalFee, setManualTotalFee] = React.useState("");
  const [selectedPengajar, setSelectedPengajar] = React.useState<Set<string>>(new Set());
  const [perRowNominal, setPerRowNominal] = React.useState<Record<string, string>>({});
  const [perRowTotal, setPerRowTotal] = React.useState<Record<string, string>>({});
  const [syncingSelection, setSyncingSelection] = React.useState(false);
  const total = items.reduce((sum, item) => sum + item.totalFee, 0);
  const loadFees = React.useCallback(async () => {
    try {
      const url =
        viewType === "MONTHLY"
          ? `/api/admin/fee?periode=${encodeURIComponent(periode)}`
          : viewType === "WEEKLY"
            ? `/api/admin/fee/payouts?periodType=WEEKLY&date=${encodeURIComponent(trackingDate)}${selectedPengajar.size ? `&selected=${encodeURIComponent([...selectedPengajar].join(","))}` : ""}`
            : `/api/admin/fee/payouts?periodType=CUSTOM&start=${encodeURIComponent(customStart)}&end=${encodeURIComponent(customEnd)}${selectedPengajar.size ? `&selected=${encodeURIComponent([...selectedPengajar].join(","))}` : ""}${manualNominal ? `&nominalPerJam=${encodeURIComponent(manualNominal)}` : ""}${manualTotalFee ? `&manualTotalFee=${encodeURIComponent(manualTotalFee)}` : ""}`;
      const result = await apiFetch<{ ok: boolean; data: FeeRow[] }>(url, { cache: "no-store" });
      setItems(result.data || []);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat fee pengajar.", "error");
    } finally {
      setLoading(false);
    }
  }, [periode, toast, trackingDate, viewType, customStart, customEnd, manualNominal, manualTotalFee, selectedPengajar]);

  React.useEffect(() => {
    void loadFees();
  }, [loadFees]);
  useVisiblePolling(loadFees, 30000);

  const markPaid = async (id: string, overrideBody?: Record<string, string>) => {
    try {
      const endpoint = viewType === "MONTHLY" ? "/api/admin/fee" : "/api/admin/fee/payouts";
      if (overrideBody) {
        await apiFetch(endpoint, { method: "PUT", body: JSON.stringify(overrideBody) });
      } else {
        const body: Record<string, string> = { id, payoutMethod: "BANK_TRANSFER", paidAt: trackingDate };
        if (manualNominal) body.nominalPerJam = manualNominal;
        if (manualTotalFee) body.manualTotalFee = manualTotalFee;
        await apiFetch(endpoint, { method: "PUT", body: JSON.stringify(body) });
      }
      await loadFees();
      toast("Fee pengajar berhasil dibayar dan tercatat di tracking finance.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal membayar fee pengajar.", "error");
    }
  };

  const uploadProof = async (id: string, file: File) => {
    try {
      if (viewType === "MONTHLY") {
        const body = new FormData();
        body.append("proof", file);
        await apiFetch(`/api/admin/fee/${id}/proof`, { method: "POST", body, headers: {} });
      } else {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
        }
        const dataUrl = `data:${file.type || "application/octet-stream"};base64,${window.btoa(binary)}`;
        await apiFetch(`/api/admin/fee/payouts`, {
          method: "PUT",
          body: JSON.stringify({
            id,
            payoutMethod: "BANK_TRANSFER",
            paidAt: trackingDate,
            paymentProofData: dataUrl,
            paymentProofName: file.name,
            paymentProofMimeType: file.type,
          }),
        });
      }
      await loadFees();
      toast("Bukti pembayaran fee berhasil diunggah dan tersinkronisasi ke finance.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengunggah bukti fee.", "error");
    }
  };

  const generateFees = async () => {
    try {
      if (viewType !== "MONTHLY") {
        await loadFees();
      } else {
        await apiFetch(`/api/admin/fee?periode=${encodeURIComponent(periode)}`, { method: "POST" });
        await loadFees();
      }
      toast("Rekap fee berhasil dibuat dari data pengajar.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal membuat rekap fee.", "error");
    }
  };
  const generateInvoiceFor = async (id: string) => {
    try {
      await apiFetch<{ ok: boolean; data: { id: string } }>(`/api/admin/invoice/generate-pengajar`, { method: "POST", body: JSON.stringify({ feeId: id }) });
      toast("Invoice pengajar berhasil dibuat.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal membuat invoice pengajar.", "error");
    }
  };
  const syncSelected = async () => {
    if (selectedPengajar.size === 0) {
      toast("Pilih minimal satu pengajar untuk disinkronkan.", "error");
      return;
    }
    setSyncingSelection(true);
    try {
      const ids = [...selectedPengajar].join(",");
      await apiFetch(
        viewType === "WEEKLY"
          ? `/api/admin/fee/payouts?periodType=WEEKLY&date=${encodeURIComponent(trackingDate)}&selected=${encodeURIComponent(ids)}`
          : `/api/admin/fee/payouts?periodType=CUSTOM&start=${encodeURIComponent(customStart)}&end=${encodeURIComponent(customEnd)}&selected=${encodeURIComponent(ids)}${manualNominal ? `&nominalPerJam=${encodeURIComponent(manualNominal)}` : ""}${manualTotalFee ? `&manualTotalFee=${encodeURIComponent(manualTotalFee)}` : ""}`,
        { method: "GET", cache: "no-store" }
      );
      await loadFees();
      toast("Seleksi pengajar berhasil disinkronkan ke tracking fee.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyinkronkan seleksi.", "error");
    } finally {
      setSyncingSelection(false);
    }
  };
  const togglePengajar = (id: string) => {
    const next = new Set(selectedPengajar);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPengajar(next);
  };
  const periodeLabel = viewType === "CUSTOM" ? `Periode Khusus ${customStart} - ${customEnd}` : viewType === "WEEKLY" ? `Mingguan ${trackingDate}` : new Date(`${periode}-01T00:00:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  return (
    <main id="admin-fee-report" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print-report-header">
        <div>
          <p className="text-sm font-semibold text-primary">Rekap pengajar</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold">Fee & Gaji Pengajar</h1>
            <p className="mt-2 text-muted-foreground">Rekap fee berdasarkan skema fee yang ditetapkan (jumlah siswa × fee per siswa per bulan) dan periode pembayaran yang dipilih.</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 print-hidden sm:w-auto">
          {viewType === "CUSTOM" ? (
            <>
              <Input aria-label="Tanggal mulai periode khusus" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="w-auto" />
              <span className="text-xs text-muted-foreground">tot</span>
              <Input aria-label="Tanggal akhir periode khusus" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="w-auto" />
              <Input aria-label="Nominal per sesi manual" placeholder="Nominal/sesi" value={manualNominal} onChange={(event) => setManualNominal(event.target.value)} className="w-auto" />
              <Input aria-label="Total fee manual" placeholder="Total fee manual" value={manualTotalFee} onChange={(event) => setManualTotalFee(event.target.value)} className="w-auto" />
            </>
          ) : (
            <Input aria-label="Pilih tanggal tracking pembayaran" type="date" value={trackingDate} onChange={(event) => setTrackingDate(event.target.value)} className="w-auto" />
          )}
          <select
            aria-label="Tipe periode"
            className="flex h-10 w-auto rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground"
            value={viewType}
            onChange={(event) => setViewType(event.target.value as FeePeriodType)}
          >
            <option value="MONTHLY">Bulanan</option>
            <option value="WEEKLY">Mingguan</option>
            <option value="CUSTOM">Periode Khusus</option>
          </select>
          <Button variant="outline" onClick={generateFees}>
            <RefreshCw size={16} /> Generate rekap
          </Button>
          {viewType !== "MONTHLY" && (
            <Button variant="secondary" isLoading={syncingSelection} onClick={syncSelected}>
              <RefreshCw size={16} /> Sinkronkan {selectedPengajar.size || "seleksi"}
            </Button>
          )}
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} /> Cetak / Simpan PDF
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
              <Coins size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total fee {periodeLabel}</p>
              <p className="font-heading text-2xl font-bold">{formatRupiah(total)}</p>
            </div>
          </div>
          <Badge variant="secondary">{items.length} pengajar</Badge>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {viewType !== "MONTHLY" && (
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={selectedPengajar.has(item.id)}
                      onChange={() => togglePengajar(item.id)}
                      aria-label={`Pilih ${item.pengajarNama} untuk sinkronisasi`}
                    />
                  )}
                  <p className="font-heading font-bold">{item.pengajarNama}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.totalJam} sesi × {formatRupiah(item.ratePerSession || item.nominalPerJam)}/sesi
                </p>
                {item.jumlahKelasDiampu ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      {item.jumlahKelasDiampu} Kelas Diampu
                    </span>
                    <span className="rounded-md bg-primary/5 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      Fee Kelas: {formatRupiah(item.totalFeeKelasBulanan || 0)}/bulan
                    </span>
                  </div>
                ) : null}
                {item.rateSessions && item.rateSessions.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.rateSessions.slice(0, 4).map((rate) => (
                      <span key={`${rate.kelasGroup}-${rate.mode}`} className="rounded-md bg-muted px-1.5 py-0.5 text-[9.5px] font-medium text-muted-foreground tabular-nums">
                        {rate.kelasGroup} {rate.mode === "ONLINE" ? "On" : "Off"} {formatRupiah(rate.rate)}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-1 font-mono font-semibold">{formatRupiah(item.totalFee)}</p>
                {item.manualTotalFee != null && (
                  <p className="mt-1 text-[11px] text-muted-foreground">Total fee manual (admin): {formatRupiah(item.manualTotalFee)}</p>
                )}
                {viewType !== "MONTHLY" && (
                  <div className="mt-2 flex flex-col gap-1 print-hidden">
                    <label className="text-[11px] font-semibold text-muted-foreground">Nominal per sesi (admin, opsional)</label>
                    <Input
                      type="number"
                      min="0"
                      placeholder={String(item.nominalPerJam)}
                      value={perRowNominal[item.id] || ""}
                      onChange={(event) => setPerRowNominal({ ...perRowNominal, [item.id]: event.target.value })}
                      className="w-32 text-xs"
                    />
                    <label className="text-[11px] font-semibold text-muted-foreground">Total fee manual (admin, opsional)</label>
                    <Input
                      type="number"
                      min="0"
                      placeholder={String(item.totalFee)}
                      value={perRowTotal[item.id] || ""}
                      onChange={(event) => setPerRowTotal({ ...perRowTotal, [item.id]: event.target.value })}
                      className="w-32 text-xs"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={item.status === "PAID" ? "success" : "warning"}>{item.status === "PAID" ? "Sudah dibayar" : "Belum dibayar"}</Badge>
                <span className="print-hidden">
                  {item.status !== "PAID" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="accent" onClick={() => {
                        const body: Record<string, string> = { id: item.id, payoutMethod: "BANK_TRANSFER", paidAt: trackingDate };
                        if (viewType !== "MONTHLY") {
                          if (perRowNominal[item.id]) body.nominalPerJam = perRowNominal[item.id];
                          if (perRowTotal[item.id]) body.manualTotalFee = perRowTotal[item.id];
                        }
                        void markPaid(item.id, body);
                      }}>
                        <CheckCircle2 size={15} /> Bayar Transfer
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => generateInvoiceFor(item.id)}>
                        <Receipt size={15} /> Buat Invoice
                      </Button>
                    </div>
                  )}
                </span>
              </div>
            </CardContent>
            <CardContent className="border-t border-border pt-3 text-xs text-muted-foreground">
              <p>
                Periode: {item.periodLabel || item.periodKey || item.periode} {item.paidAt ? `• Dibayar: ${new Date(item.paidAt).toLocaleDateString("id-ID")}` : "• Belum ada tanggal pembayaran"}
              </p>
              <p>
                Rekening: {item.teacherBankName || "Belum diatur"} {item.teacherAccountNumber || ""} a.n. {item.teacherAccountName || "-"}
              </p>
              {item.paymentProofData && (
                <button
                  type="button"
                  onClick={() => setPreviewProof({ name: item.paymentProofName || "Bukti Pembayaran", url: item.paymentProofData!, mimeType: item.paymentProofMimeType })}
                  className="mt-1 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  <ExternalLink size={13} /> Pratinjau Bukti: {item.paymentProofName}
                </button>
              )}
              <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted print-hidden">
                <Upload size={13} /> Unggah bukti pembayaran
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void uploadProof(item.id, file);
                  }}
                />
              </label>
            </CardContent>
          </Card>
        ))}
        {loading && <p className="text-sm text-muted-foreground">Memuat data fee...</p>}
        {!loading && items.length === 0 && <p className="text-sm text-muted-foreground">Belum ada fee pengajar di database.</p>}
      </div>

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
    </main>
  );
}
