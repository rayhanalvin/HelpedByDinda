"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Plus, Printer, TrendingUp, WalletCards, X, Loader2, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { FinanceRecord } from "@/lib/dummy-data";
import { formatRupiah } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const categoryLabels: Record<FinanceRecord["kategori"], string> = { pembayaran_murid: "Pembayaran murid", fee_pengajar: "Fee pengajar", operasional: "Operasional", promosi: "Promosi" };

export default function AdminFinancePage() {
  const { toast } = useToast();
  const [records, setRecords] = React.useState<FinanceRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"bulanan" | "tahunan">("bulanan");
  const [showForm, setShowForm] = React.useState(false);
  const [editingRecord, setEditingRecord] = React.useState<(FinanceRecord & { source?: "PAYMENT" | "FEE" | "MANUAL" }) | null>(null);
  const [form, setForm] = React.useState({ tanggal: new Date().toISOString().slice(0, 10), kategori: "operasional" as FinanceRecord["kategori"], keterangan: "", jumlah: "" });
  const year = String(new Date().getFullYear());

  const loadFinanceRecords = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ ok: boolean; data: FinanceRecord[] }>("/api/admin/finance");
      if (res.ok) {
        setRecords(res.data);
      }
    } catch {
      // fallback empty
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadFinanceRecords();
  }, [loadFinanceRecords]);

  const currentRecords = records.filter((record) => record.tanggal.startsWith(year));
  const gross = currentRecords.filter((record) => record.tipe === "pendapatan").reduce((sum, record) => sum + record.jumlah, 0);
  const expenses = currentRecords.filter((record) => record.tipe === "pengeluaran").reduce((sum, record) => sum + record.jumlah, 0);
  const net = gross - expenses;
  const chart =
    view === "bulanan"
      ? monthNames.map((label, index) => ({
          label,
          gross: currentRecords.filter((record) => new Date(record.tanggal).getMonth() === index && record.tipe === "pendapatan").reduce((sum, record) => sum + record.jumlah, 0),
          expense: currentRecords.filter((record) => new Date(record.tanggal).getMonth() === index && record.tipe === "pengeluaran").reduce((sum, record) => sum + record.jumlah, 0),
        }))
      : [{ label: year, gross, expense: expenses }];
  const maxValue = Math.max(...chart.flatMap((item) => [item.gross, item.expense]), 1);

  const addExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(form.jumlah);
    if (!form.keterangan || !amount || amount <= 0) return;
    try {
      const res = await apiFetch<{ ok: boolean; data: FinanceRecord }>("/api/admin/finance", {
        method: "POST",
        body: JSON.stringify({
          keterangan: form.keterangan,
          jumlah: amount,
          tanggal: form.tanggal,
          kategori: form.kategori,
        }),
      });
      if (res.ok) {
        setRecords((current) => [res.data, ...current]);
        setForm({ tanggal: new Date().toISOString().slice(0, 10), kategori: "operasional", keterangan: "", jumlah: "" });
        setShowForm(false);
        toast("Pengeluaran berhasil dicatat.", "success");
      }
    } catch {
      toast("Gagal mencatat pengeluaran ke database.", "error");
    }
  };

  const openEdit = (record: FinanceRecord & { source?: "PAYMENT" | "FEE" | "MANUAL" }) => {
    if (record.source !== "MANUAL") {
      toast("Pembayaran dan fee pengajar mengikuti data sumber dan tidak dapat diedit dari Finance.", "info");
      return;
    }
    setEditingRecord(record);
    setForm({ tanggal: record.tanggal, kategori: record.kategori, keterangan: record.keterangan, jumlah: String(record.jumlah) });
    setShowForm(true);
  };

  const editExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingRecord) return;
    try {
      const result = await apiFetch<{ ok: boolean; data: FinanceRecord }>("/api/admin/finance", {
        method: "PUT",
        body: JSON.stringify({ id: editingRecord.id, source: "MANUAL", tanggal: form.tanggal, kategori: form.kategori, keterangan: form.keterangan, jumlah: Number(form.jumlah) }),
      });
      setRecords((current) => current.map((record) => (record.id === editingRecord.id ? result.data : record)));
      setEditingRecord(null);
      setShowForm(false);
      toast("Transaksi berhasil diperbarui.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memperbarui transaksi.", "error");
    }
  };

  const deleteExpense = async (record: FinanceRecord & { source?: "PAYMENT" | "FEE" | "MANUAL" }) => {
    if (record.source !== "MANUAL") {
      toast("Pembayaran dan fee pengajar tidak dapat dihapus dari Finance.", "info");
      return;
    }
    if (!window.confirm("Hapus transaksi ini?")) return;
    try {
      await apiFetch("/api/admin/finance", { method: "DELETE", body: JSON.stringify({ id: record.id, source: "MANUAL" }) });
      setRecords((current) => current.filter((item) => item.id !== record.id));
      toast("Transaksi berhasil dihapus.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menghapus transaksi.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Memuat data keuangan...
      </div>
    );
  }

  return (
    <main id="finance-report" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print-report-header">
        <div>
          <p className="text-sm font-semibold text-primary">Laporan keuangan</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold">Finance & Arus Kas</h1>
          <p className="mt-2 text-muted-foreground">Lihat arus kas bimbel dengan ringkas—pendapatan, pengeluaran, dan hasil bersih dalam satu tempat.</p>
        </div>
        <div className="flex flex-wrap gap-2 print-hidden">
          <Button variant="outline" onClick={() => setShowForm((current) => !current)}>
            <Plus size={16} /> Catat Pengeluaran
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} /> Cetak / Simpan PDF
          </Button>
        </div>
      </div>
      {showForm && (
        <Card className="print-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{editingRecord ? "Edit Transaksi" : "Catat Pengeluaran Baru"}</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => setShowForm(false)} aria-label="Tutup form">
                <X size={17} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingRecord ? editExpense : addExpense} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input type="date" required value={form.tanggal} onChange={(event) => setForm({ ...form, tanggal: event.target.value })} />
              <select className="h-11 rounded-xl border bg-card px-3 text-sm" value={form.kategori} onChange={(event) => setForm({ ...form, kategori: event.target.value as FinanceRecord["kategori"] })}>
                <option value="operasional">Operasional</option>
                <option value="promosi">Promosi</option>
                <option value="fee_pengajar">Fee pengajar</option>
              </select>
              <Input required placeholder="Keterangan pengeluaran" value={form.keterangan} onChange={(event) => setForm({ ...form, keterangan: event.target.value })} />
              <div className="flex gap-2">
                <Input required type="number" min="1" placeholder="Jumlah rupiah" value={form.jumlah} onChange={(event) => setForm({ ...form, jumlah: event.target.value })} />
                <Button type="submit" variant="accent">
                  {editingRecord ? "Perbarui" : "Simpan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendapatan kotor</p>
                <p className="mt-2 font-heading text-2xl font-bold text-accent">{formatRupiah(gross)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Total pembayaran lunas</p>
              </div>
              <ArrowUpRight className="text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total pengeluaran</p>
                <p className="mt-2 font-heading text-2xl font-bold text-rose-600">{formatRupiah(expenses)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Fee dan operasional</p>
              </div>
              <ArrowDownRight className="text-rose-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendapatan bersih</p>
                <p className={`mt-2 font-heading text-2xl font-bold ${net >= 0 ? "text-primary" : "text-rose-600"}`}>{formatRupiah(net)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Kotor dikurangi pengeluaran</p>
              </div>
              <TrendingUp className="text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <WalletCards size={19} className="text-primary" /> Grafik Arus Kas
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Perbandingan pendapatan kotor dan pengeluaran tahun {year}.</p>
          </div>
          <div className="flex rounded-xl border p-1 print-hidden">
            <button className={`rounded-lg px-3 py-2 text-sm font-semibold ${view === "bulanan" ? "bg-primary text-white" : "text-muted-foreground"}`} onClick={() => setView("bulanan")}>
              Bulanan
            </button>
            <button className={`rounded-lg px-3 py-2 text-sm font-semibold ${view === "tahunan" ? "bg-primary text-white" : "text-muted-foreground"}`} onClick={() => setView("tahunan")}>
              Tahunan
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${view === "bulanan" ? "grid-cols-6 md:grid-cols-12" : "grid-cols-1"}`}>
            {chart.map((item) => (
              <div key={item.label} className="min-w-0">
                <div className="flex h-56 items-end justify-center gap-1 border-b border-l px-1 pb-0">
                  {" "}
                  <div title={`Pendapatan ${formatRupiah(item.gross)}`} className="w-1/3 rounded-t-md bg-accent" style={{ height: `${Math.max((item.gross / maxValue) * 100, item.gross ? 4 : 0)}%` }} />
                  <div title={`Pengeluaran ${formatRupiah(item.expense)}`} className="w-1/3 rounded-t-md bg-rose-400" style={{ height: `${Math.max((item.expense / maxValue) * 100, item.expense ? 4 : 0)}%` }} />
                </div>
                <p className="mt-2 text-center text-xs font-semibold text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-accent" /> Pendapatan kotor
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-rose-400" /> Pengeluaran
            </span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Rincian Transaksi Keuangan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentRecords.map((record) => (
              <div key={record.id} className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={record.tipe === "pendapatan" ? "success" : "destructive"}>{record.tipe}</Badge>
                    <span className="text-xs text-muted-foreground">{record.tanggal}</span>
                    <span className="text-xs text-muted-foreground">{categoryLabels[record.kategori]}</span>
                  </div>
                  <p className="mt-2 font-semibold">{record.keterangan}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-mono font-bold ${record.tipe === "pendapatan" ? "text-accent" : "text-rose-600"}`}>
                    {record.tipe === "pendapatan" ? "+" : "-"}
                    {formatRupiah(record.jumlah)}
                  </p>
                  {(record as FinanceRecord & { source?: string }).source === "MANUAL" && (
                    <div className="flex gap-1 print-hidden">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(record as FinanceRecord & { source?: "PAYMENT" | "FEE" | "MANUAL" })} aria-label="Edit transaksi">
                        <Pencil size={15} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteExpense(record as FinanceRecord & { source?: "PAYMENT" | "FEE" | "MANUAL" })} aria-label="Hapus transaksi">
                        <Trash2 size={15} className="text-rose-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
