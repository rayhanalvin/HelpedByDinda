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
  periodType?: "WEEKLY" | "MONTHLY";
  periodKey?: string;
};

export default function AdminFeePage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<FeeRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [trackingDate, setTrackingDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [previewProof, setPreviewProof] = React.useState<{ name: string; url: string; mimeType: string | null } | null>(null);
  const periode = trackingDate.slice(0, 7);
  const [viewType, setViewType] = React.useState<"MONTHLY" | "WEEKLY">("MONTHLY");
  const total = items.reduce((sum, item) => sum + item.totalFee, 0);
  const loadFees = React.useCallback(async () => {
    try {
      const url = viewType === "MONTHLY" ? `/api/admin/fee?periode=${encodeURIComponent(periode)}` : `/api/admin/fee/payouts?periodType=WEEKLY&date=${encodeURIComponent(trackingDate)}`;
      const result = await apiFetch<{ ok: boolean; data: FeeRow[] }>(url, { cache: "no-store" });
      setItems(result.data || []);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat fee pengajar.", "error");
    } finally {
      setLoading(false);
    }
  }, [periode, toast, trackingDate, viewType]);

  React.useEffect(() => {
    void loadFees();
  }, [loadFees]);
  useVisiblePolling(loadFees, 30000);

  const markPaid = async (id: string) => {
    try {
      const endpoint = viewType === "WEEKLY" ? "/api/admin/fee/payouts" : "/api/admin/fee";
      await apiFetch(endpoint, { method: "PUT", body: JSON.stringify({ id, payoutMethod: "BANK_TRANSFER", paidAt: trackingDate }) });
      await loadFees();
      toast("Fee pengajar berhasil dibayar dan tercatat di tracking finance.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal membayar fee pengajar.", "error");
    }
  };

  const uploadProof = async (id: string, file: File) => {
    try {
      const body = new FormData();
      body.append("proof", file);
      await apiFetch(`/api/admin/fee/${id}/proof`, { method: "POST", body, headers: {} });
      await loadFees();
      toast("Bukti pembayaran fee berhasil diunggah.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengunggah bukti fee.", "error");
    }
  };

  const generateFees = async () => {
    try {
      if (viewType === "WEEKLY") {
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
  const periodeLabel = new Date(`${periode}-01T00:00:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  return (
    <main id="admin-fee-report" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print-report-header">
        <div>
          <p className="text-sm font-semibold text-primary">Rekap pengajar</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold">Fee & Gaji Pengajar</h1>
          <p className="mt-2 text-muted-foreground">Rekap fee berdasarkan jam mengajar valid dan periode pembayaran yang dipilih.</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 print-hidden sm:w-auto">
          <Input aria-label="Pilih tanggal tracking pembayaran" type="date" value={trackingDate} onChange={(event) => setTrackingDate(event.target.value)} className="w-auto" />
          <Button variant="ghost" onClick={() => setViewType(viewType === "MONTHLY" ? "WEEKLY" : "MONTHLY")}>
            {viewType === "MONTHLY" ? "Tampilkan Mingguan" : "Tampilkan Bulanan"}
          </Button>
          <Button variant="outline" onClick={generateFees}>
            <RefreshCw size={16} /> Generate rekap
          </Button>
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
                <p className="font-heading font-bold">{item.pengajarNama}</p>
                <p className="text-sm text-muted-foreground">
                  {item.totalJam} jam × {formatRupiah(item.nominalPerJam)}/jam
                </p>
                <p className="mt-1 font-mono font-semibold">{formatRupiah(item.totalFee)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={item.status === "PAID" ? "success" : "warning"}>{item.status === "PAID" ? "Sudah dibayar" : "Belum dibayar"}</Badge>
                <span className="print-hidden">
                  {item.status !== "PAID" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="accent" onClick={() => markPaid(item.id)}>
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
                Periode: {item.periodKey || item.periode} {item.paidAt ? `• Dibayar: ${new Date(item.paidAt).toLocaleDateString("id-ID")}` : "• Belum ada tanggal pembayaran"}
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
