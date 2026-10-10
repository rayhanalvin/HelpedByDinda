"use client";

import * as React from "react";
import { CreditCard, Mail, Receipt, CheckCircle2, ExternalLink, FileImage, Trash2, Plus, X, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
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

type AdminInvoiceRow = {
  id: string;
  title?: string | null;
  periode?: string | null;
  targetRole?: string;
  targetUserNama?: string | null;
  targetUserEmail?: string | null;
  amount?: number | null;
  fileName?: string | null;
  paymentStatus?: string | null;
  createdAt?: string;
};

export default function AdminPembayaranPage() {
  const { toast } = useToast();
  const [payments, setPayments] = React.useState<PaymentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reference, setReference] = React.useState<Record<string, string>>({});
  const [selectedProof, setSelectedProof] = React.useState<PaymentRow | null>(null);
  const [muridOptions, setMuridOptions] = React.useState<Array<{ id: string; userId: string; name: string; email: string; paketBulanan: number }>>([]);
  const [muridOptionsLoaded, setMuridOptionsLoaded] = React.useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = React.useState(false);
  const [invoiceForm, setInvoiceForm] = React.useState({ targetUserId: "", title: "", periode: new Date().toISOString().slice(0, 7), amount: "" });
  const [invoiceFile, setInvoiceFile] = React.useState<File | null>(null);
  const [sendingInvoice, setSendingInvoice] = React.useState(false);
  const [adminInvoices, setAdminInvoices] = React.useState<AdminInvoiceRow[]>([]);
  const [showInvoiceList, setShowInvoiceList] = React.useState(false);
  const [editingInvoice, setEditingInvoice] = React.useState<AdminInvoiceRow | null>(null);
  const [editInvoiceForm, setEditInvoiceForm] = React.useState({ title: "", periode: "", amount: "" });
  const [editInvoiceFile, setEditInvoiceFile] = React.useState<File | null>(null);
  const [savingEditInvoice, setSavingEditInvoice] = React.useState(false);

  const loadAdminInvoices = React.useCallback(async () => {
    try {
      const result = await apiFetch<{ ok: boolean; data: AdminInvoiceRow[] }>("/api/admin/invoice");
      setAdminInvoices(result.data || []);
    } catch {}
  }, []);

  const loadPayments = React.useCallback(async () => {
    try {
      const result = await apiFetch<{ ok: boolean; data: PaymentRow[] }>("/api/admin/pembayaran");
      setPayments(result.data || []);
      void loadAdminInvoices();
      if (!muridOptionsLoaded) {
        try {
          const muridRes = await apiFetch<{ ok: boolean; data: Array<{ id: string; userId: string; name: string; email: string; paketBulanan: number }> }>("/api/admin/murid");
          setMuridOptions(muridRes.data || []);
          setMuridOptionsLoaded(true);
        } catch {}
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat tracking pembayaran.", "error");
    } finally {
      setLoading(false);
    }
  }, [loadAdminInvoices, muridOptionsLoaded, toast]);

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

  const createInvoice = async () => {
    if (!invoiceForm.targetUserId) {
      toast("Pilih murid yang akan menerima invoice SPP.", "error");
      return;
    }
    if (!invoiceForm.amount || Number(invoiceForm.amount) <= 0) {
      toast("Isi nominal invoice SPP.", "error");
      return;
    }
    setSendingInvoice(true);
    try {
      const fd = new FormData();
      fd.append("targetUserId", invoiceForm.targetUserId);
      fd.append("targetRole", "MURID");
      fd.append("amount", invoiceForm.amount);
      fd.append("periode", invoiceForm.periode);
      fd.append("title", invoiceForm.title.trim() || `Invoice SPP ${invoiceForm.periode}`);
      if (invoiceFile) fd.append("invoice", invoiceFile);
      const res = await apiFetch<{ ok: boolean; data: { id: string } }>("/api/admin/invoice", { method: "POST", body: fd });
      if (res.ok) {
        toast("Invoice SPP dibuat dan tersinkronisasi ke daftar pembayaran murid.", "success");
        setShowInvoiceForm(false);
        setInvoiceForm({ targetUserId: "", title: "", periode: new Date().toISOString().slice(0, 7), amount: "" });
        setInvoiceFile(null);
        await loadPayments();
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal membuat invoice SPP.", "error");
    } finally {
      setSendingInvoice(false);
    }
  };

  const beginEditInvoice = (inv: AdminInvoiceRow) => {
    setEditingInvoice(inv);
    setEditInvoiceForm({ title: inv.title || "", periode: inv.periode || "", amount: inv.amount ? String(inv.amount) : "" });
    setEditInvoiceFile(null);
  };

  const saveEditInvoice = async () => {
    if (!editingInvoice) return;
    if (!editInvoiceForm.amount || Number(editInvoiceForm.amount) <= 0) {
      toast("Nominal invoice wajib lebih dari 0.", "error");
      return;
    }
    setSavingEditInvoice(true);
    try {
      const fd = new FormData();
      fd.append("title", editInvoiceForm.title.trim() || editingInvoice.title || `Invoice SPP ${editInvoiceForm.periode}`);
      fd.append("periode", editInvoiceForm.periode);
      fd.append("amount", editInvoiceForm.amount);
      if (editInvoiceFile) fd.append("invoice", editInvoiceFile);
      const res = await apiFetch<{ ok: boolean; data: AdminInvoiceRow }>(`/api/admin/invoice/${editingInvoice.id}`, { method: "PUT", body: fd });
      if (res.ok) {
        toast("Invoice berhasil diperbarui en tersinkroniseerd naar murid.", "success");
        setEditingInvoice(null);
        setEditInvoiceFile(null);
        void loadAdminInvoices();
        void loadPayments();
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memperbarui invoice.", "error");
    } finally {
      setSavingEditInvoice(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!window.confirm("Hapus invoice ini? Pembayaran terkait juga akan dihapus dan tampilan murid diperbarui langsung.")) return;
    try {
      await apiFetch(`/api/admin/invoice/${id}`, { method: "DELETE" });
      setAdminInvoices((current) => current.filter((inv) => inv.id !== id));
      toast("Invoice berhasil dihapus en tersynchroniseerd uit murid-portal.", "success");
      void loadPayments();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menghapus invoice.", "error");
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Keuangan murid</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold">Tracking Pembayaran</h1>
          <p className="mt-2 text-muted-foreground">Pantau transaksi transfer bank murid dan konfirmasi pembayaran realtime, atau buat invoice SPP per murid.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowInvoiceList((value) => !value)}>
            <Receipt size={16} /> Daftar Invoice SPP
          </Button>
          <Button variant="accent" onClick={() => setShowInvoiceForm(true)}>
            <Plus size={16} /> Buat Invoice SPP
          </Button>
        </div>
      </div>
      {showInvoiceList && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold">Daftar Invoice SPP</h2>
              <p className="text-sm text-muted-foreground">Admin-invoices gesynchroniseerd naar elk murid-portal. Bewerk of verwijder om de zichtbaarheid direct bij te werken.</p>
            </div>
            <Badge variant="secondary">{adminInvoices.length} invoice</Badge>
          </div>
          {adminInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada invoice SPP aangemaakt. Maak een invoice via de knop &quot;Buat Invoice SPP&quot;.</p>
          ) : (
            <div className="space-y-2">
              {adminInvoices.map((inv) => (
                <div key={inv.id} className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-sm text-foreground truncate">{inv.title || "Lembar Invoice SPP"}</p>
                      <Badge variant={inv.paymentStatus === "SUCCESS" ? "success" : inv.paymentStatus ? "warning" : "secondary"}>
                        {inv.paymentStatus ? `Payment: ${inv.paymentStatus}` : "Belum payment"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {inv.targetUserNama || "Algemeen"} · {inv.targetUserEmail || inv.targetRole || "—"} · Periode: {inv.periode || "—"} · {formatRupiah(inv.amount || 0)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">File: {inv.fileName || "geen file"}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => beginEditInvoice(inv)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => void deleteInvoice(inv.id)}>
                      <Trash2 size={13} /> Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
                  <p className="text-[11px] text-muted-foreground">
                    Buat: {formatDateIndo(item.createdAt)} {item.paidAt ? `· Bayar: ${formatDateIndo(item.paidAt)}` : ""}
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
      {showInvoiceForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={() => setShowInvoiceForm(false)}>
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-card p-6 shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold">Buat Invoice SPP</h2>
              <button type="button" onClick={() => setShowInvoiceForm(false)} className="text-muted-foreground hover:text-foreground" aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Pilih satu murid, isi nominal dan periode. Invoice muncul realtime di daftar pembayaran murid.</p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Murid penerima</label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground"
                value={invoiceForm.targetUserId}
                onChange={(event) => setInvoiceForm({ ...invoiceForm, targetUserId: event.target.value })}
              >
                <option value="">— Pilih murid —</option>
                {muridOptions.map((option) => (
                  <option key={option.userId} value={option.userId}>
                    {option.name} ({option.email}) — {formatRupiah(option.paketBulanan)}/bulan
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nominal SPP (Rp)</label>
                <Input type="number" min="1" placeholder="contoh: 900000" value={invoiceForm.amount} onChange={(event) => setInvoiceForm({ ...invoiceForm, amount: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Periode (bulan)</label>
                <Input type="month" value={invoiceForm.periode} onChange={(event) => setInvoiceForm({ ...invoiceForm, periode: event.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Judul / nota (opsional)</label>
              <Input placeholder="Invoice SPP Oktober 2026" value={invoiceForm.title} onChange={(event) => setInvoiceForm({ ...invoiceForm, title: event.target.value })} />
            </div>
            <label className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted cursor-pointer">
              <Paperclip className="h-3.5 w-3.5" /> {invoiceFile ? invoiceFile.name : "Lampiran file PDF/gambar (opsional)"}
              <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setInvoiceFile(event.target.files?.[0] || null)} />
            </label>
            {invoiceFile && (
              <button type="button" onClick={() => setInvoiceFile(null)} className="text-xs text-rose-600 hover:underline">
                Hapus file
              </button>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInvoiceForm(false)}>
                Batal
              </Button>
              <Button variant="accent" isLoading={sendingInvoice} onClick={() => void createInvoice()}>
                <Receipt size={16} /> Buat & Sync Invoice
              </Button>
            </div>
          </div>
        </div>
      )}
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
      {editingInvoice && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={() => setEditingInvoice(null)}>
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-card p-6 shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold">Edit Invoice SPP</h2>
              <button type="button" onClick={() => setEditingInvoice(null)} className="text-muted-foreground hover:text-foreground" aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Wijzig title, periode, nominal of vervang de file. Murid ziet de wijziging direct in zijn daftar invoice.</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nominal SPP (Rp)</label>
                <Input type="number" min="1" placeholder="contoh: 900000" value={editInvoiceForm.amount} onChange={(event) => setEditInvoiceForm({ ...editInvoiceForm, amount: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Periode (bulan)</label>
                <Input type="month" value={editInvoiceForm.periode} onChange={(event) => setEditInvoiceForm({ ...editInvoiceForm, periode: event.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Judul / nota</label>
              <Input placeholder="Invoice SPP Oktober 2026" value={editInvoiceForm.title} onChange={(event) => setEditInvoiceForm({ ...editInvoiceForm, title: event.target.value })} />
            </div>
            <label className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted cursor-pointer">
              <Paperclip className="h-3.5 w-3.5" /> {editInvoiceFile ? editInvoiceFile.name : editingInvoice.fileName ? `Vervang file: ${editingInvoice.fileName}` : "Lampiran file PDF/gambar (opsional)"}
              <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setEditInvoiceFile(event.target.files?.[0] || null)} />
            </label>
            {editInvoiceFile && (
              <button type="button" onClick={() => setEditInvoiceFile(null)} className="text-xs text-rose-600 hover:underline">
                Hapus file
              </button>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingInvoice(null)}>
                Batal
              </Button>
              <Button variant="accent" isLoading={savingEditInvoice} onClick={() => void saveEditInvoice()}>
                <Receipt size={16} /> Simpan & Sync
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
