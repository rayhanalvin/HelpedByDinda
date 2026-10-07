"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const CATEGORIES = [
  { value: "SD", label: "SD" },
  { value: "SMP", label: "SMP" },
  { value: "SMA", label: "SMA" },
  { value: "KULIAH", label: "Kuliah" },
];

export default function MuridOnboardingPage() {
  const [category, setCategory] = React.useState<string>(CATEGORIES[0].value);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const submit = async () => {
    setIsSaving(true);
    try {
      const res = await apiFetch<{ ok: boolean; data?: { onboardingComplete: boolean; onboardingCategory: string | null }; message?: string }>("/api/murid/onboarding", {
        method: "PUT",
        body: JSON.stringify({ category }),
      });
      if (res.ok) {
        toast("Formulir pendaftaran berhasil disimpan.", "success");
        router.push("/murid/dashboard");
      } else {
        toast(res.message || "Gagal menyimpan formulir.", "error");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyimpan formulir.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Formulir Pendaftaran Murid</CardTitle>
          <CardDescription>Isi kategori pendidikan yang sesuai untuk proses registrasi.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Kategori Pendidikan</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`p-3 rounded-xl border text-left ${category === c.value ? "border-primary bg-primary/10" : "border-border"}`}
                  >
                    <div className="font-bold">{c.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Pilih kategori yang sesuai</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="accent" isLoading={isSaving} onClick={submit} className="font-bold">
                Selesai & Simpan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
