"use client";

import * as React from "react";
import { Send, CalendarCheck2, CreditCard, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { DUMMY_REMINDER_LOGS } from "@/lib/dummy-data";
import { apiFetch } from "@/lib/api";
import { useVisiblePolling } from "@/lib/use-visible-polling";
import * as ApiTypes from "@/types/api";
import { MessageSquarePlus } from "lucide-react";

export default function AdminPengingatPage() {
  const { toast } = useToast();
  const [logs, setLogs] = React.useState<ApiTypes.ReminderLog[]>(DUMMY_REMINDER_LOGS.map((log) => ({ ...log, id: String(log.id) })));
  const [loadingType, setLoadingType] = React.useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = React.useState(false);
  const [targets, setTargets] = React.useState({ activeTeachers: 0, pendingStudents: 0, attendanceTargets: 0 });

  // State for message composer
  const [messageTitle, setMessageTitle] = React.useState("");
  const [messageBody, setMessageBody] = React.useState("");
  const [messageTarget, setMessageTarget] = React.useState<"ALL" | "MURID" | "PENGAJAR">("ALL");
  const [sendingMsg, setSendingMsg] = React.useState(false);
  const [attachment, setAttachment] = React.useState<File | null>(null);

  const loadLogs = React.useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await apiFetch<{ ok: boolean; data: ApiTypes.ReminderLog[]; meta?: typeof targets }>("/api/admin/reminder", { cache: "no-store" });
      setLogs(res.data || []);
      if (res.meta) setTargets(res.meta);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal memuat log pengingat", "error");
    } finally {
      setLoadingLogs(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void loadLogs();
  }, [loadLogs]);
  useVisiblePolling(loadLogs, 30000);

  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageTitle.trim() || !messageBody.trim()) {
      toast("Judul dan isi pesan wajib diisi.", "error");
      return;
    }
    setSendingMsg(true);
    try {
      // If there's an attachment, upload via FormData to allow file transfer
      let res;
      if (attachment) {
        const fd = new FormData();
        fd.append("title", messageTitle);
        fd.append("body", messageBody);
        fd.append("targetRole", messageTarget);
        fd.append("attachment", attachment);
        res = await apiFetch<{ ok: boolean; count: number }>("/api/admin/messages", { method: "POST", body: fd });
      } else {
        res = await apiFetch<{ ok: boolean; count: number }>("/api/admin/messages", {
          method: "POST",
          body: JSON.stringify({ title: messageTitle, body: messageBody, targetRole: messageTarget }),
        });
      }
      if (res.ok) {
        toast(`Pesan berhasil disiarkan ke ${res.count} penerima!`, "success");
        setMessageTitle("");
        setMessageBody("");
        setAttachment(null);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal mengirimkan pesan admin", "error");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSendReminder = async (type: "mengajar" | "bayar" | "absen" | "invoice_murid" | "invoice_pengajar") => {
    setLoadingType(type);
    try {
      await apiFetch<{ ok: boolean; data: ApiTypes.ReminderLog[] }>("/api/admin/reminder", { method: "POST", body: JSON.stringify({ type }) });
      setLoadingType(null);
      toast("Pengingat dikirim dan dicatat pada audit log.", "success");
      await loadLogs();
    } catch (err) {
      setLoadingType(null);
      toast(err instanceof Error ? err.message : "Gagal mengirim pengingat", "error");
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await apiFetch(`/api/admin/reminder?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      toast("Log pengiriman dihapus.", "success");
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menghapus log", "error");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Pusat Pengingat Email 1-Klik</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Kirim notifikasi email otomatis kepada pengajar dan murid menggunakan integrasi Resend.</p>
      </div>

      {/* 3 Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel 1: Pengingat Mengajar */}
        <Card className="border-border hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-primary mb-3">
              <Clock className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Pengingat Jadwal Mengajar</CardTitle>
            <CardDescription>Kirim jadwal sesi bimbingan besok ke seluruh pengajar (H-1 dan H-30 menit sebelum sesi).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/40 text-xs space-y-1">
              <p className="font-semibold text-foreground">Target: {targets.activeTeachers} Pengajar Aktif</p>
              <p className="text-muted-foreground">Template: Resend HTML Mengajar</p>
            </div>
            <Button variant="default" isLoading={loadingType === "mengajar"} onClick={() => handleSendReminder("mengajar")} className="w-full font-bold gap-2">
              <Send className="h-4 w-4" /> Kirim Pengingat Mengajar
            </Button>
          </CardContent>
        </Card>

        {/* Panel 2: Pengingat Bayar */}
        <Card className="border-border hover:border-accent/40 transition-all shadow-xs flex flex-col justify-between">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-3">
              <CreditCard className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Pengingat Tagihan SPP</CardTitle>
            <CardDescription>Kirim tautan pembayaran Midtrans Snap ke email murid dan wali yang berstatus pending.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/40 text-xs space-y-1">
              <p className="font-semibold text-foreground">Target: {targets.pendingStudents} Tagihan Pending</p>
              <p className="text-muted-foreground">Template: Invoice Reminder Midtrans</p>
            </div>
            <Button variant="accent" isLoading={loadingType === "bayar"} onClick={() => handleSendReminder("bayar")} className="w-full font-bold gap-2">
              <Send className="h-4 w-4" /> Kirim Pengingat SPP
            </Button>
          </CardContent>
        </Card>

        {/* Panel 3: Pengingat Absen */}
        <Card className="border-border hover:border-amber-400 transition-all shadow-xs flex flex-col justify-between">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-3">
              <CalendarCheck2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Pengingat Presensi Sesi</CardTitle>
            <CardDescription>Kirim pengingat presensi kehadiran ke tutor dan murid sebelum kelas hari ini dimulai.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/40 text-xs space-y-1">
              <p className="font-semibold text-foreground">Target: {targets.attendanceTargets} Penerima Sesi Hari Ini</p>
              <p className="text-muted-foreground">Template: Prompt Kehadiran Realtime</p>
            </div>
            <Button variant="outline" isLoading={loadingType === "absen"} onClick={() => handleSendReminder("absen")} className="w-full font-bold gap-2 hover:bg-amber-50 hover:text-amber-900">
              <Send className="h-4 w-4" /> Kirim Pengingat Presensi
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Admin Message Broadcast Composer */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageSquarePlus className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Kirim Pesan Pengumuman Admin</CardTitle>
            <CardDescription>Kirim pesan broadcast pengumuman penting langsung ke kotak masuk bell (in-app notification) pengajar dan murid.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendAdminMessage} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-foreground">Judul Pengumuman</label>
                <Input required placeholder="Asesmen pembelajaran, Pengumuman Libur, dsb." value={messageTitle} onChange={(e) => setMessageTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Target Penerima</label>
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={messageTarget}
                  onChange={(e) => setMessageTarget(e.target.value as "ALL" | "MURID" | "PENGAJAR")}
                >
                  <option value="ALL">Semua Pengajar & Murid</option>
                  <option value="MURID">Hanya Murid Aktif</option>
                  <option value="PENGAJAR">Hanya Pengajar Aktif</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Isi Pengumuman</label>
              <textarea
                required
                rows={4}
                placeholder="Tulis pesan pengumuman atau instruksi di sini..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="flex w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Lampiran (PDF / Gambar)</label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 rounded border px-3 py-2 cursor-pointer">
                  Pilih file
                  <input type="file" accept="application/pdf,image/*" className="sr-only" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                </label>
                {attachment && <div className="text-sm text-muted-foreground">{attachment.name}</div>}
                {attachment && (
                  <Button variant="destructive" size="sm" onClick={() => setAttachment(null)}>
                    Hapus
                  </Button>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="default" isLoading={sendingMsg} className="font-bold">
                Siarkan Pesan / Pengumuman
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Remove mass invoice upload per request — replaced by attachment in admin message composer */}

      {/* Audit Log Pengiriman Email */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-base">Audit Log Pengiriman Notifikasi Email (Resend)</CardTitle>
          <CardDescription>Riwayat lengkap email yang telah dikirimkan oleh sistem atau dipicu secara manual oleh admin</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase font-semibold text-muted-foreground bg-muted/30">
                <tr>
                  <th className="py-3 px-4">Tipe Pengingat</th>
                  <th className="py-3 px-4">Target Penerima</th>
                  <th className="py-3 px-4">Keterangan / Pesan</th>
                  <th className="py-3 px-4">Waktu Kirim</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <Badge variant="default" className="text-[10px] uppercase">
                        {log.tipe}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-foreground text-xs">{log.targetNama}</p>
                      <p className="text-[11px] text-muted-foreground">{log.targetEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-foreground max-w-xs">{log.keterangan}</td>
                    <td className="py-3 px-4 text-xs font-mono text-muted-foreground">{new Date(log.sentAt).toLocaleString("id-ID")}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {log.status.toUpperCase()}
                        </span>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteLog(String(log.id))} className="ml-2">
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
