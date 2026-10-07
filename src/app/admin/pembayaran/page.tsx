"use client";

import * as React from "react";
import { CreditCard, Mail, Receipt, CheckCircle2, ExternalLink, FileImage, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatRupiah } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type PaymentRow = {
  id: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "EXPIRED";
  orderId: string;
  paidAt: string | null;
  createdAt: string;
  murid: string;
  email: string;
  paymentMethod: string | null;
  recipientBankName: string | null;
  recipientAccountNumber: string | null;
  recipientAccountName: string | null;
  paymentReference: string | null;
  paymentProofData: string | null;
  paymentProofName: string | null;
  paymentProofMimeType: string | null;
  paymentProofUploadedAt: string | null;
};

const statusVariant = { SUCCESS: "success", PENDING: "warning", PROCESSING: "secondary", FAILED: "destructive", EXPIRED: "secondary" } as const;

export default function AdminPembayaranPage() {
  const { toast } = useToast();
  const [payments, setPayments] = React.useState<PaymentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reference, setReference] = React.useState<Record<string, string>>({});
  const [selectedProof, setSelectedProof] = React.useState<PaymentRow | null>(null);

  const loadPayments = React.useCallback(async () => {
    try {
      const result = await apiFetch<{ ok: boolean; data: PaymentRow[] }>("/api/admin/pembayaran");
      setPayments(result.data || []);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat tracking pembayaran.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void loadPayments();
  }, [loadPayments]);
  useVisiblePolling(loadPayments, 30000);

  const confirmPayment = async (id: string) => {
    try {
      await apiFetch("/api/admin/pembayaran", {
        method: "PUT",
        body: JSON.stringify({ id, status: "SUCCESS", paymentReference: reference[id] || "" }),
      });
      await loadPayments();
      toast("Pembayaran dikonfirmasi dan tersimpan di tracking admin.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengonfirmasi pembayaran.", "error");
    }
  };

  const deletePayment = async (id: string) => {
    if (!window.confirm("Hapus transaksi pembayaran ini? Tindakan ini tidak dapat dibatalkan.")) return;
    try {
      await apiFetch("/api/admin/pembayaran", { method: "DELETE", body: JSON.stringify({ id }) });
      setPayments((current) => current.filter((item) => item.id !== id));
      if (selectedProof?.id === id) setSelectedProof(null);
      toast("Transaksi pembayaran berhasil dihapus.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menghapus transaksi pembayaran.", "error");
    }
  };

  const total = payments.reduce((sum, item) => sum + item.amount, 0);
  const paid = payments.filter((item) => item.status === "SUCCESS").length;
  const pending = payments.filter((item) => item.status === "PENDING" || item.status === "PROCESSING").length;

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Keuangan murid</p>
        <h1 className="mt-1 font-heading text-3xl font-extrabold">Tracking Pembayaran</h1>
        <p className="mt-2 text-muted-foreground">Pantau transaksi transfer bank murid dan konfirmasi pembayaran secara tersinkronisasi.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total transaksi</p>
            <p className="mt-2 font-heading text-2xl font-bold">{formatRupiah(total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Sudah dibayar</p>
            <p className="mt-2 font-heading text-2xl font-bold text-accent">{paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Menunggu konfirmasi</p>
            <p className="mt-2 font-heading text-2xl font-bold text-warning">{pending}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-3">
        {payments.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                  <Receipt size={19} />
                </div>
                <div>
                  <p className="font-heading font-bold">{item.murid}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.email} · {item.orderId}
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold">{formatRupiah(item.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    Metode: {item.paymentMethod === "BANK_TRANSFER" ? "Transfer bank" : item.paymentMethod ? "Metode lama" : "-"} · Tujuan: {item.recipientBankName || "-"} {item.recipientAccountNumber || ""}
                  </p>
                  {item.paymentProofName && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <FileImage size={13} /> Bukti: {item.paymentProofName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
                  <CreditCard size={18} className="text-muted-foreground" />
                </div>
                {item.status === "PENDING" || item.status === "PROCESSING" ? (
                  <div className="flex gap-2">
                    <Input placeholder="No. referensi" value={reference[item.id] || ""} onChange={(e) => setReference((current) => ({ ...current, [item.id]: e.target.value }))} className="h-8 w-36 text-xs" />
                    <Button size="sm" variant="accent" onClick={() => confirmPayment(item.id)}>
                      <CheckCircle2 size={14} /> Konfirmasi
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast("Pengingat pembayaran dimasukkan ke antrean.", "success")}>
                      <Mail size={14} /> Ingatkan
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Ref: {item.paymentReference || "-"}</span>
                )}
                {item.paymentProofData && (
                  <Button size="sm" variant="outline" onClick={() => setSelectedProof(item)}>
                    <ExternalLink size={14} /> Lihat bukti
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => deletePayment(item.id)} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                  <Trash2 size={14} /> Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {loading && <p className="text-sm text-muted-foreground">Memuat tracking pembayaran...</p>}
        {!loading && payments.length === 0 && <p className="text-sm text-muted-foreground">Belum ada transaksi pembayaran di database.</p>}
      </div>
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedProof(null)}>
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-card p-5" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-bold">Bukti Pembayaran</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedProof.murid} · {selectedProof.paymentProofName}
                </p>
              </div>
              <Button variant="outline" onClick={() => setSelectedProof(null)}>
                Tutup
              </Button>
            </div>
            {selectedProof.paymentProofMimeType === "application/pdf" ? (
              <iframe src={selectedProof.paymentProofData || undefined} title={`Bukti pembayaran ${selectedProof.orderId}`} className="h-[70vh] w-full rounded-xl border border-border" />
            ) : (
              <img src={selectedProof.paymentProofData || undefined} alt={`Bukti pembayaran ${selectedProof.orderId}`} className="mx-auto max-h-[70vh] max-w-full rounded-xl object-contain" />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
