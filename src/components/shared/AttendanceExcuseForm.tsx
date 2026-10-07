"use client";

import * as React from "react";
import { FileCheck2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";

const MAX_PROOF_SIZE = 3 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Props = { jadwalId: string; disabled?: boolean; onSubmitted: () => Promise<void> };

export function AttendanceExcuseForm({ jadwalId, disabled = false, onSubmitted }: Props) {
  const { toast } = useToast();
  const [status, setStatus] = React.useState<"IZIN" | "SAKIT">("IZIN");
  const [proof, setProof] = React.useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [catatan, setCatatan] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const selectProof = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast("Bukti harus berupa gambar JPG, PNG, atau WEBP.", "error");
      return;
    }
    if (file.size > MAX_PROOF_SIZE) {
      toast("Ukuran gambar bukti maksimal 3 MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setProof({ data: reader.result, mimeType: file.type, name: file.name });
      else toast("Gambar bukti tidak dapat dibaca.", "error");
    };
    reader.onerror = () => toast("Gambar bukti tidak dapat dibaca.", "error");
    reader.readAsDataURL(file);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (disabled) return;
    if (!proof) {
      toast("Unggah foto bukti izin atau sakit terlebih dahulu.", "error");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/absensi", {
        method: "POST",
        body: JSON.stringify({ action: "absence", jadwalId, status, proofData: proof.data, proofMimeType: proof.mimeType, proofName: proof.name, catatan }),
      });
      toast(`Pengajuan ${status.toLowerCase()} berhasil dikirim.`, "success");
      setProof(null);
      setCatatan("");
      await onSubmitted();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengirim pengajuan absensi.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className="text-sm font-semibold">Tidak dapat hadir?</p>
        <p className="mt-1 text-xs text-muted-foreground">Pilih alasan dan sertakan foto bukti. Pengajuan akan terlihat oleh admin dan peserta sesi.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1 sm:col-span-2 sm:w-fit">
        {(["IZIN", "SAKIT"] as const).map((value) => (
          <button key={value} type="button" disabled={disabled || saving} onClick={() => setStatus(value)} className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${status === value ? "bg-card text-primary shadow-xs" : "text-muted-foreground"}`}>
            {value === "IZIN" ? "Izin" : "Sakit"}
          </button>
        ))}
      </div>
      <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm font-medium hover:bg-muted">
        <Upload className="h-4 w-4" /> {proof ? proof.name : "Pilih foto bukti"}
        <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" disabled={disabled || saving} onChange={selectProof} />
      </label>
      <input value={catatan} onChange={(event) => setCatatan(event.target.value)} disabled={disabled || saving} maxLength={500} placeholder="Catatan tambahan (opsional)" className="min-h-11 min-w-0 rounded-xl border border-input bg-card px-3 text-sm" />
      {proof && <div className="flex items-center gap-2 text-xs text-emerald-700 sm:col-span-2"><FileCheck2 className="h-4 w-4" /> Bukti siap dikirim</div>}
      <Button type="submit" variant="outline" isLoading={saving} disabled={disabled} className="sm:col-span-2 sm:w-fit">Kirim Pengajuan {status === "IZIN" ? "Izin" : "Sakit"}</Button>
      {disabled && <p className="text-xs text-muted-foreground sm:col-span-2">Pengajuan hanya dapat dikirim sebelum presensi sesi dimulai.</p>}
    </form>
  );
}
