"use client";

import * as React from "react";
import { ExternalLink, FileCheck2, FileImage, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { formatDateIndo, formatRupiah } from "@/lib/utils";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type PaymentRow = {
  id: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "EXPIRED";
  orderId: string;
  paymentMethod: string | null;
  paymentProofData: string | null;
  paymentProofName: string | null;
  paymentProofMimeType: string | null;
  paymentProofUploadedAt: string | null;
  createdAt: string;
};

const statusVariant = { SUCCESS: "success", PENDING: "warning", PROCESSING: "secondary", FAILED: "destructive", EXPIRED: "secondary" } as const;

export default function MuridBuktiPembayaranPage() {
  const { toast } = useToast();
  const [payments, setPayments] = React.useState<PaymentRow[]>([]);
  const [uploadingId, setUploadingId] = React.useState<string | null>(null);

  const loadPayments = React.useCallback(async () => {
    try {
      const result = await apiFetch<{ ok: boolean; data: PaymentRow[] }>("/api/payments");
      setPayments(result.data || []);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat transaksi pembayaran.", "error");
    }
  }, [toast]);

  React.useEffect(() => {
    void loadPayments();
  }, [loadPayments]);
  useVisiblePolling(loadPayments, 30000);

  const uploadProof = async (paymentId: string, file: File) => {
    setUploadingId(paymentId);
    try {
      const body = new FormData();
      body.append("proof", file);
      const result = await apiFetch<{ ok: boolean; data: PaymentRow }>(`/api/payments/${paymentId}/proof`, { method: "POST", body, headers: {} });
      setPayments((current) => current.map((payment) => (payment.id === paymentId ? { ...payment, ...result.data } : payment)));
      toast("Bukti pembayaran berhasil dikirim ke admin.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengunggah bukti pembayaran.", "error");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Verifikasi pembayaran</p>
        <h1 className="mt-1 font-heading text-3xl font-extrabold">Bukti Pembayaran Bimbel</h1>
        <p className="mt-2 text-muted-foreground">Unggah bukti transfer dalam format gambar atau PDF agar dapat diperiksa admin.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            Riwayat Bukti Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <FileImage className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{payment.orderId}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatRupiah(payment.amount)} · {payment.paymentMethod || "Metode belum dipilih"}
                  </p>
                  <p className="text-xs text-muted-foreground">Dibuat {formatDateIndo(payment.createdAt)}</p>
                  {payment.paymentProofName && <p className="mt-1 text-xs font-medium text-emerald-700">File: {payment.paymentProofName}</p>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Badge variant={statusVariant[payment.status]}>{payment.status}</Badge>
                {payment.paymentProofData && (
                  <a href={payment.paymentProofData} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Lihat bukti
                  </a>
                )}
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">
                  <Upload className="h-3.5 w-3.5" /> {uploadingId === payment.id ? "Mengunggah..." : payment.paymentProofData ? "Ganti bukti" : "Unggah bukti"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="sr-only"
                    disabled={uploadingId !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void uploadProof(payment.id, file);
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
          {payments.length === 0 && <p className="text-sm text-muted-foreground">Belum ada transaksi. Buat instruksi pembayaran terlebih dahulu.</p>}
        </CardContent>
      </Card>
    </main>
  );
}
