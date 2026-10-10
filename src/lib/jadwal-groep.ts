// Helper untuk mengelompokkan baris jadwal per kelompok: satu sesi per kelompokId,
// dengan semua anggota kelompok di `leden`. Sesi privat tetap satu lawan satu.

export type JadwalGroepLid = {
  muridId: string;
  murid: string;
};

export type JadwalSessie = {
  id: string;
  pengajarId: string;
  muridId: string;
  kelompokId: string | null;
  kelompokNama: string | null;
  kelompokMurid: string[];
  mataPelajaran: string;
  tanggal: Date | string;
  jamMulai: string;
  jamSelesai: string;
  startedAt?: Date | string | null;
  mode: "ONLINE" | "OFFLINE" | "online" | "offline" | string;
  ruangan: string | null;
  catatan: string | null;
  status: string;
  pengajar: string;
  murid: string;
  isGroep: boolean;
  leden: JadwalGroepLid[];
};

type RawJadwal = {
  id: string;
  pengajarId: string;
  muridId: string;
  kelompokId?: string | null;
  kelompokNama?: string | null;
  mataPelajaran: string;
  tanggal: Date | string;
  jamMulai: string;
  jamSelesai: string;
  startedAt?: Date | string | null;
  mode?: string;
  ruangan?: string | null;
  catatan?: string | null;
  status?: string;
  pengajar?: { user?: { name?: string | null } | null } | string | null;
  murid?: { user?: { name?: string | null } | null } | string | null;
};

function resolveName(pengajar?: RawJadwal["pengajar"] | string | null, fallback = "Pengajar") {
  if (!pengajar) return fallback;
  if (typeof pengajar === "string") return pengajar;
  return pengajar?.user?.name || fallback;
}

function resolveMuridName(murid?: RawJadwal["murid"] | string | null, fallback = "Murid") {
  if (!murid) return fallback;
  if (typeof murid === "string") return murid;
  return murid?.user?.name || fallback;
}

export function groeperJadwal(raw: RawJadwal[]): JadwalSessie[] {
  const groups = new Map<string, RawJadwal[]>();
  const privates: RawJadwal[] = [];

  for (const item of raw) {
    if (item.kelompokId) {
      const list = groups.get(item.kelompokId) || [];
      list.push(item);
      groups.set(item.kelompokId, list);
    } else {
      privates.push(item);
    }
  }

  const result: JadwalSessie[] = [];

  for (const item of privates) {
    result.push({
      id: item.id,
      pengajarId: item.pengajarId,
      muridId: item.muridId,
      kelompokId: null,
      kelompokNama: null,
      kelompokMurid: [],
      mataPelajaran: item.mataPelajaran,
      tanggal: item.tanggal,
      jamMulai: item.jamMulai,
      jamSelesai: item.jamSelesai,
      startedAt: item.startedAt || null,
      mode: (item.mode || "ONLINE").toLowerCase() as "online" | "offline",
      ruangan: item.ruangan || null,
      catatan: item.catatan || null,
      status: item.status || "TERJADWAL",
      pengajar: resolveName(item.pengajar),
      murid: resolveMuridName(item.murid),
      isGroep: false,
      leden: [{ muridId: item.muridId, murid: resolveMuridName(item.murid) }],
    });
  }

  for (const [, members] of groups) {
    const sorted = [...members].sort((a, b) => (a.muridId || "").localeCompare(b.muridId || ""));
    const head = sorted[0];
    const leden = sorted.map((member) => ({ muridId: member.muridId, murid: resolveMuridName(member.murid) }));
    result.push({
      id: head.id,
      pengajarId: head.pengajarId,
      muridId: head.muridId,
      kelompokId: head.kelompokId || null,
      kelompokNama: head.kelompokNama || null,
      kelompokMurid: leden.map((lid) => lid.murid),
      mataPelajaran: head.mataPelajaran,
      tanggal: head.tanggal,
      jamMulai: head.jamMulai,
      jamSelesai: head.jamSelesai,
      startedAt: head.startedAt || null,
      mode: (head.mode || "ONLINE").toLowerCase() as "online" | "offline",
      ruangan: head.ruangan || null,
      catatan: head.catatan || null,
      status: head.status || "TERJADWAL",
      pengajar: resolveName(head.pengajar),
      murid: leden.map((lid) => lid.murid).join(", "),
      isGroep: true,
      leden,
    });
  }

  return result;
}