"use client";

import * as React from "react";
import { CreditCard, CheckCircle2, Clock, ArrowRight, ShieldCheck, Receipt, Building, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { Download, FileCheck, Receipt as ReceiptIcon } from "lucide-react";
import { useVisiblePolling } from "@/lib/use-visible-polling";

type PaymentRow = {
  id: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "EXPIRED";
  orderId: string;
  paymentMethod: string | null;
  recipientBankName: string | null;
  recipientAccountNumber: string | null;
  recipientAccountName: string | null;
  paymentReference: string | null;
  paidAt: string | null;
  createdAt: string;
};

type InvoiceRow = {
  id: string;
  title?: string | null;
  periode?: string | null;
  fileName?: string | null;
  createdAt?: string | null;
};

export default function MuridPembayaranPage() {
  const { toast } = useToast();
  const [payments, setPayments] = React.useState<PaymentRow[]>([]);
  const [settings, setSettings] = React.useState<{ bankName: string | null; accountNumber: string | null; accountName: string | null } | null>(null);
  const [billAmount, setBillAmount] = React.useState(0);
  const [billStatus, setBillStatus] = React.useState<"pending" | "dibayar" | "gagal">("pending");
  const [isSnapModalOpen, setIsSnapModalOpen] = React.useState(false);
  const [isPaying, setIsPaying] = React.useState(false);
  const [paymentHistory, setPaymentHistory] = React.useState<PaymentRow[]>([]);

  // Extra Invoices
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

  const loadPayments = React.useCallback(async () => {
    try {
      const result = await apiFetch<{ ok: boolean; data: PaymentRow[]; settings: typeof settings; billAmount: number; billStatus: string }>("/api/payments");
      setPayments(result.data || []);
      setPaymentHistory(result.data || []);
      setSettings(result.settings);
      setBillAmount(result.billAmount || 0);
      setBillStatus(result.billStatus === "SUCCESS" ? "dibayar" : result.billStatus === "FAILED" || result.billStatus === "EXPIRED" ? "gagal" : "pending");
      await loadInvoices();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat pembayaran.", "error");
    }
  }, [loadInvoices, toast]);
  React.useEffect(() => { void loadPayments(); }, [loadPayments]);
  useVisiblePolling(loadPayments, 30000);

  const activeBill = {
    orderId: payments[0]?.orderId || "Belum ada invoice",
    periode: new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    jumlah: billAmount || payments[0]?.amount || 0,
    program: "Bimbel SMA (Kelas 11)",
  };

  const createPayment = async () => {
    setIsPaying(true);
    try {
      const result = await apiFetch<{ ok: boolean; data: PaymentRow }>("/api/payments", {
        method: "POST",
        body: JSON.stringify({ amount: activeBill.jumlah, paymentMethod: "BANK_TRANSFER" }),
      });
      setPayments((current) => [result.data, ...current]);
      setPaymentHistory((current) => [result.data, ...current]);
      setBillStatus("pending");
      setIsSnapModalOpen(false);
      toast("Instruksi transfer bank dibuat. Admin akan memverifikasi transaksi.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal membuat transaksi.", "error");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Pembayaran & Tagihan Saya</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Lakukan pembayaran SPP bimbingan bulanan secara aman melalui payment gateway Midtrans Snap.</p>
      </div>

      {/* Invoice Download Panel */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <ReceiptIcon className="h-5 w-5 text-primary" /> Berkas Invoice SPP Dari Admin
          </CardTitle>
          <CardDescription>Daftar invoice dan berkas rincian tagihan lembar SPP yang telah diunggah oleh admin untuk Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 font-medium">Belum ada rincian berkas invoice SPP yang diunggah oleh admin untuk Anda.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoices.map((inv) => (
                <div key={inv.id} className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <FileCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{inv.title || "Lembar Invoice SPP"}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Periode: {inv.periode || "Umum"} • file: {inv.fileName || "invoice.pdf"}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" disabled={downloadingId !== null} onClick={() => downloadInvoice(inv.id, inv.fileName || "invoice.pdf")} className="text-xs font-bold gap-1 text-primary">
                      <Download className="h-4 w-4" /> {downloadingId === inv.id ? "Mengunduh..." : "Download Invoice"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Bill Card */}
      <Card
        className={`border-2 transition-all shadow-sm overflow-hidden ${
          billStatus === "pending" || billStatus === "gagal" ? "border-amber-300 bg-linear-to-br from-amber-50/50 via-card to-card" : "border-emerald-300 bg-linear-to-br from-emerald-50/50 via-card to-card"
        }`}
      >
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={billStatus === "dibayar" ? "success" : billStatus === "gagal" ? "destructive" : "warning"} className="text-xs px-3 py-1">
                {billStatus === "dibayar" ? "LUNAS / TERBAYAR" : billStatus === "gagal" ? "PEMBAYARAN GAGAL" : "MENUNGGU PEMBAYARAN"}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">{activeBill.orderId}</span>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">Periode: {activeBill.periode}</span>
          </div>

          <CardTitle className="text-xl sm:text-2xl mt-2 text-foreground">Tagihan Bimbingan Belajar {activeBill.periode}</CardTitle>
          <CardDescription>
            Paket Program: <span className="font-bold text-foreground">{activeBill.program}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-5 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Pembayaran Bulan Ini</p>
              <h3 className="text-3xl font-black text-foreground tabular-nums mt-1">{formatRupiah(activeBill.jumlah)}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Jatuh tempo: <span className="font-semibold text-rose-600">Tanggal ditentukan admin</span>
              </p>
            </div>

            <div>
              {billStatus === "pending" || billStatus === "gagal" ? (
                <Button
                  variant="accent"
                  size="lg"
                  onClick={() => {
                    setIsSnapModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-8 h-12 text-base font-extrabold gap-2 shadow-md hover:shadow-lg"
                >
                  <CreditCard className="h-5 w-5" />
                  {billStatus === "gagal" ? "Coba Bayar Lagi" : "Bayar Sekarang via Midtrans"}
                </Button>
              ) : (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold">Tagihan periode ini telah terbayar lunas.</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Terverifikasi Aman Midtrans Snap
            </span>
            <span className="flex items-center gap-1.5">
              <Building className="h-4 w-4 text-purple-600" /> Virtual Account Bank Otomatis
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Riwayat Pembayaran */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Pembayaran Sebelumnya</CardTitle>
          <CardDescription>Catatan invoice bulanan yang pernah diterbitkan untuk akunmu</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase font-semibold text-muted-foreground bg-muted/30">
                <tr>
                  <th className="py-3 px-4">Invoice / Order ID</th>
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4">Jumlah</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tanggal Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paymentHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-foreground">{item.orderId}</td>
                    <td className="py-3.5 px-4 font-medium text-foreground">{new Date(item.createdAt).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</td>
                    <td className="py-3.5 px-4 font-bold text-foreground tabular-nums">{formatRupiah(item.amount)}</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{item.paymentMethod || "-"}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={item.status === "SUCCESS" ? "success" : item.status === "FAILED" ? "destructive" : "warning"}>{item.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{item.paidAt ? formatDateIndo(item.paidAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {paymentHistory.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border p-4 space-y-2 bg-card shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-muted-foreground">{item.orderId}</span>
                  <Badge variant={item.status === "SUCCESS" ? "success" : item.status === "FAILED" ? "destructive" : "warning"}>{item.status}</Badge>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Periode {new Date(item.createdAt).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</p>
                    <p className="text-base font-extrabold text-foreground tabular-nums">{formatRupiah(item.amount)}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{item.paymentMethod || "-"}</p>
                    <p className="text-[10px] mt-0.5">{item.paidAt ? formatDateIndo(item.paidAt) : "Pending"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Midtrans Snap Simulation Modal */}
      <Modal isOpen={isSnapModalOpen} onClose={() => setIsSnapModalOpen(false)} title="Midtrans Snap Payment Gateway" description="Pilih metode pembayaran yang Anda inginkan (Simulasi Sandbox)." className="max-w-md">
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-secondary/50 border border-primary/20 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Tagihan SPP</p>
              <p className="text-2xl font-black text-foreground tabular-nums">{formatRupiah(activeBill.jumlah)}</p>
            </div>
            <Badge variant="default" className="text-[10px] font-mono">
              SANDBOX MODE
            </Badge>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-semibold text-foreground">Transfer bank:</p>
            <div className="w-full rounded-xl border border-primary bg-primary/10 p-3 text-left">
              <span className="flex items-center justify-between font-medium">
                <span>{settings?.bankName || "Rekening Bank"}</span>
                <span className="font-mono text-muted-foreground">{settings?.accountNumber || "Belum diatur"}</span>
              </span>
              <span className="mt-1 block text-[11px] text-muted-foreground">a.n. {settings?.accountName || "Belum diatur"}</span>
              <span className="mt-1 block text-[11px] text-muted-foreground">Transfer bank</span>
            </div>
            <Button variant="accent" isLoading={isPaying} onClick={createPayment} className="w-full">
              Buat Instruksi Pembayaran
            </Button>
          </div>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Setelah transfer bank, simpan bukti transaksi dan tunggu konfirmasi admin.</p>
            <p className="text-xs font-semibold text-primary">Metode pembayaran: Transfer bank</p>
            <Button variant="outline" onClick={() => setIsSnapModalOpen(false)} className="w-full text-xs">
              Batal / Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
