"use client";

import * as React from "react";
import Image from "next/image";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export type ProfileRole = "admin" | "pengajar" | "murid";

const MAX_AVATAR_SIZE = 3 * 1024 * 1024;
const avatarStoragePrefix = "helped-by-dinda-avatar";

function getStorageKey(role: ProfileRole, userId?: string | number) {
  return userId ? `${avatarStoragePrefix}:${role}:${userId}` : `${avatarStoragePrefix}:${role}`;
}

function getNameStorageKey(role: ProfileRole, userId?: string | number) {
  return userId ? `${avatarStoragePrefix}:name:${role}:${userId}` : `${avatarStoragePrefix}:name:${role}`;
}

export function useProfileAvatar(role: ProfileRole, defaultAvatarUrl: string, userId?: string | number) {
  const [avatarUrl, setAvatarUrl] = React.useState(defaultAvatarUrl);

  React.useEffect(() => {
    if (!userId) {
      // No user identity yet: always show the server-provided value.
      setAvatarUrl(defaultAvatarUrl);
      return;
    }
    const storageKey = getStorageKey(role, userId);
    // Cleanup legacy generic (user-id-less) keys to avoid cross-account leaks.
    window.localStorage.removeItem(getStorageKey(role));
    const syncAvatar = () => {
      const storedAvatar = window.localStorage.getItem(storageKey);
      setAvatarUrl(storedAvatar || defaultAvatarUrl);
    };
    syncAvatar();

    const handleAvatarChange = (event: StorageEvent | Event) => {
      if (event instanceof StorageEvent && event.key !== storageKey) {
        return;
      }

      const nextAvatar = window.localStorage.getItem(storageKey);
      setAvatarUrl(nextAvatar || defaultAvatarUrl);
    };

    window.addEventListener("storage", handleAvatarChange);
    window.addEventListener("profile-avatar-change", handleAvatarChange);
    return () => {
      window.removeEventListener("storage", handleAvatarChange);
      window.removeEventListener("profile-avatar-change", handleAvatarChange);
    };
  }, [defaultAvatarUrl, role, userId]);

  const updateAvatar = React.useCallback(
    (nextAvatar: string) => {
      const storageKey = getStorageKey(role, userId);
      if (nextAvatar) {
        window.localStorage.setItem(storageKey, nextAvatar);
        setAvatarUrl(nextAvatar);
      } else {
        window.localStorage.removeItem(storageKey);
        setAvatarUrl(defaultAvatarUrl);
      }
      window.dispatchEvent(new Event("profile-avatar-change"));
    },
    [role, userId, defaultAvatarUrl],
  );

  return { avatarUrl, updateAvatar };
}

export function useProfileName(role: ProfileRole, defaultName: string, userId?: string | number) {
  const storageKey = getNameStorageKey(role, userId);
  const [name, setName] = React.useState(defaultName);

  React.useEffect(() => {
    if (!userId) {
      // No user identity yet: always show the server-provided value.
      setName(defaultName);
      return;
    }
    // Cleanup legacy generic (user-id-less) keys to avoid cross-account leaks.
    window.localStorage.removeItem(getNameStorageKey(role));
    const syncName = () => {
      const storedName = window.localStorage.getItem(storageKey);
      setName(storedName || defaultName);
    };
    syncName();

    const handleNameChange = (event: StorageEvent | Event) => {
      if (event instanceof StorageEvent && event.key !== storageKey) {
        return;
      }

      const nextName = window.localStorage.getItem(storageKey);
      setName(nextName || defaultName);
    };

    window.addEventListener("storage", handleNameChange);
    window.addEventListener("profile-name-change", handleNameChange);
    return () => {
      window.removeEventListener("storage", handleNameChange);
      window.removeEventListener("profile-name-change", handleNameChange);
    };
  }, [defaultName, role, storageKey, userId]);

  const updateName = React.useCallback(
    (nextName: string) => {
      const cleanedName = nextName.trim();
      if (!cleanedName) {
        return;
      }
      window.localStorage.setItem(storageKey, cleanedName);
      setName(cleanedName);
      window.dispatchEvent(new Event("profile-name-change"));
    },
    [storageKey],
  );

  return { name, updateName };
}

export function useProfileEmail(role: ProfileRole, defaultEmail: string, userId?: string | number) {
  const storageKey = `helped-by-dinda-email:${role}${userId ? `:${userId}` : ""}`;
  const [email, setEmail] = React.useState(defaultEmail || "");

  React.useEffect(() => {
    if (!userId) {
      setEmail(defaultEmail || "");
      return;
    }
    window.localStorage.removeItem(`helped-by-dinda-email:${role}`);
    const syncEmail = () => {
      const stored = window.localStorage.getItem(storageKey);
      setEmail(stored || defaultEmail || "");
    };
    syncEmail();

    const handleChange = (event: StorageEvent | Event) => {
      if (event instanceof StorageEvent && event.key !== storageKey) return;
      const next = window.localStorage.getItem(storageKey) || defaultEmail || "";
      setEmail(next);
    };

    window.addEventListener("storage", handleChange);
    window.addEventListener("profile-email-change", handleChange);
    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener("profile-email-change", handleChange);
    };
  }, [defaultEmail, role, storageKey, userId]);

  const updateEmail = React.useCallback(
    (nextEmail: string) => {
      const cleaned = nextEmail.trim();
      if (!cleaned) return;
      window.localStorage.setItem(storageKey, cleaned);
      setEmail(cleaned);
      window.dispatchEvent(new Event("profile-email-change"));
    },
    [storageKey],
  );

  return { email, updateEmail };
}

interface ProfileAvatarUploaderProps {
  role: ProfileRole;
  defaultAvatarUrl: string;
  name: string;
  userId?: string | number;
  onAvatarChange?: (avatarUrl: string) => void;
  size?: "md" | "lg";
}

export function ProfileAvatarPreview({ role, defaultAvatarUrl, name, userId, className }: { role: ProfileRole; defaultAvatarUrl: string; name: string; userId?: string | number; className?: string }) {
  const { avatarUrl } = useProfileAvatar(role, defaultAvatarUrl, userId);
  const src = avatarUrl || "";
  return <Image src={src} alt={name} width={96} height={96} unoptimized className={className ?? "h-full w-full object-cover"} />;
}

export function ProfileNamePreview({ role, defaultName, userId, className }: { role: ProfileRole; defaultName: string; userId?: string | number; className?: string }) {
  const { name } = useProfileName(role, defaultName, userId);
  return <span className={className}>{name}</span>;
}

export function ProfileAvatarUploader({ role, defaultAvatarUrl, name, userId, onAvatarChange, size = "lg" }: ProfileAvatarUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { avatarUrl, updateAvatar } = useProfileAvatar(role, defaultAvatarUrl, userId);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast("Pilih file gambar dengan format JPG, PNG, atau WEBP.", "error");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast("Ukuran foto maksimal 3 MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        toast("Foto tidak dapat diproses. Silakan coba file lain.", "error");
        return;
      }

      try {
        const base64 = reader.result;
        void (async () => {
          try {
            const res = await fetch("/api/profile", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ avatarUrl: base64 }),
            });
            const data = await res.json().catch(() => ({}));
            updateAvatar(base64);
            onAvatarChange?.(base64);
            toast(res.ok && data.ok ? "Foto profil berhasil diperbarui." : "Foto profil disimpan secara lokal.", res.ok && data.ok ? "success" : "info");
          } catch {
            updateAvatar(base64);
            onAvatarChange?.(base64);
            toast("Foto profil disimpan secara lokal karena koneksi gagal.", "info");
          }
        })();
      } catch {
        toast("Foto terlalu besar untuk disimpan di browser.", "error");
      }
    };
    reader.onerror = () => toast("Foto tidak dapat dibaca. Silakan coba lagi.", "error");
    reader.readAsDataURL(file);
  };

  const imageSize = size === "lg" ? "h-24 w-24 rounded-2xl" : "h-16 w-16 rounded-xl";
  const avatarSrc = avatarUrl || "";

  const handleRemove = async () => {
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        updateAvatar("");
        onAvatarChange?.("");
        toast("Foto profil berhasil dihapus.", "success");
      } else {
        // even if server deletion failed, clear local avatar to let UI update
        updateAvatar("");
        onAvatarChange?.("");
        toast((data && data.message) || "Gagal menghapus foto dari server.", "error");
      }
    } catch {
      toast("Gagal menghapus foto profil.", "error");
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={() => inputRef.current?.click()} className={cn("group relative overflow-hidden border-2 border-primary/20 bg-muted", imageSize)} aria-label={`Pilih atau ganti foto profil ${name}`}>
        <Image src={avatarSrc} alt={name} width={96} height={96} unoptimized className="h-full w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera className="h-6 w-6" />
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="sr-only" />
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          <ImagePlus className="h-3.5 w-3.5" />
          {avatarUrl === defaultAvatarUrl ? "Tambah foto" : "Ganti foto"}
        </button>
        {avatarUrl !== defaultAvatarUrl && (
          <button type="button" onClick={handleRemove} className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline">
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </button>
        )}
      </div>
    </div>
  );
}
