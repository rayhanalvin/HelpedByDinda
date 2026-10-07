"use client";

import * as React from "react";
import { Bell, Check, Trash2, X, Download, FileText } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Attachment = { id: string; fileName?: string | null; fileMimeType?: string | null };

type MessageItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
  sender: { name: string };
  attachments?: Attachment[];
};

export function MessageInbox() {
  const [messages, setMessages] = React.useState<MessageItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<{ url: string; mime?: string; fileName?: string } | null>(null);
  const [thumbnails, setThumbnails] = React.useState<Record<string, string>>({});

  const handleTryDownloadInvoice = async (title: string, body: string) => {
    // Extract context clues like period or candidate filenames if it looks like an invoice notification
    const isInvoice = title.toLowerCase().includes("invoice") || title.toLowerCase().includes("tagihan") || body.toLowerCase().includes("invoice");
    if (!isInvoice) return;

    // Fallback: query invoices and pick best match
    try {
      const res = await apiFetch<{ ok: boolean; data: Array<{ id: string; title?: string; periode?: string; fileName?: string }> }>("/api/invoice");
      if (!res.ok || !res.data || res.data.length === 0) return;

      let matched = res.data[0];
      for (const inv of res.data) {
        if (inv.title && title.toLowerCase().includes(inv.title.toLowerCase())) {
          matched = inv;
          break;
        }
        if (inv.periode && body.toLowerCase().includes(inv.periode.toLowerCase())) {
          matched = inv;
          break;
        }
      }

      await downloadInvoice(matched.id);
    } catch {
      // ignore
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    setDownloadingId(invoiceId);
    try {
      const response = await apiFetch<{ ok: boolean; data: { fileData: string; fileName: string; fileMimeType: string } }>("/api/invoice", {
        method: "POST",
        body: JSON.stringify({ id: invoiceId }),
      });
      if (response.ok && response.data.fileData) {
        setPreview({ url: response.data.fileData, mime: response.data.fileMimeType, fileName: response.data.fileName });
      }
    } catch {
      // Ignore unavailable legacy invoice records.
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadAttachment = async (attachmentId: string) => {
    setDownloadingId(attachmentId);
    try {
      const dlRes = await apiFetch<{ ok: boolean; data: { fileData: string; fileName: string; fileMimeType: string } }>(`/api/messages?attachmentId=${encodeURIComponent(attachmentId)}`);
      if (dlRes.ok && dlRes.data.fileData) {
        setPreview({ url: dlRes.data.fileData, mime: dlRes.data.fileMimeType, fileName: dlRes.data.fileName });
      }
    } catch {
      // ignore
    } finally {
      setDownloadingId(null);
    }
  };

  const load = React.useCallback(async () => {
    try {
      const result = await apiFetch<{ ok: boolean; data: MessageItem[]; unreadCount: number }>("/api/messages", { cache: "no-store" });
      setMessages(result.data || []);
      setUnreadCount(result.unreadCount || 0);
    } catch {
      // The header remains available if the session is unavailable.
    }
  }, []);

  React.useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 10000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  // When the inbox is opened, prefetch small thumbnails for image attachments to make them easier to view.
  const loadThumbnailsForMessages = React.useCallback(async () => {
    try {
      const idsToLoad: string[] = [];
      messages.forEach((message) => {
        if (message.attachments) {
          for (const att of message.attachments) {
            if (att.fileMimeType && att.fileMimeType.startsWith("image/") && !thumbnails[att.id]) {
              idsToLoad.push(att.id);
            }
          }
        }
      });

      for (const id of idsToLoad) {
        try {
          const dlRes = await apiFetch<{ ok: boolean; data: { fileData: string; fileName: string; fileMimeType: string } }>(`/api/messages?attachmentId=${encodeURIComponent(id)}`);
          if (dlRes.ok && dlRes.data.fileData) {
            setThumbnails((prev) => ({ ...prev, [id]: dlRes.data.fileData }));
          }
        } catch {
          // ignore thumbnail load failures
        }
      }
    } catch {
      // ignore
    }
  }, [messages, thumbnails]);

  React.useEffect(() => {
    if (open) void loadThumbnailsForMessages();
  }, [open, loadThumbnailsForMessages]);

  const markRead = async (id: string) => {
    setLoading(true);
    try {
      await apiFetch("/api/messages", { method: "PATCH", body: JSON.stringify({ id }) });
      await load();
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    setLoading(true);
    try {
      await apiFetch(`/api/messages?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setMessages((current) => current.filter((message) => message.id !== id));
      await load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button type="button" aria-label={`Pesan${unreadCount ? ` belum dibaca ${unreadCount}` : ""}`} onClick={() => setOpen((value) => !value)} className="relative rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
      {open && (
        <div className="fixed right-4 top-16 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-3 shadow-2xl">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <p className="font-bold">Pesan Admin</p>
              <p className="text-xs text-muted-foreground">{unreadCount} belum dibaca</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup pesan">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 max-h-[60vh] space-y-2 overflow-y-auto">
            {messages.length === 0 && <p className="py-5 text-center text-sm text-muted-foreground">Belum ada pesan.</p>}
            {messages.map((message) => (
              <div key={message.id} className={`rounded-xl border p-3 ${message.readAt ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{message.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Dari {message.sender.name} • {new Date(message.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                  {!message.readAt && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">BARU</span>}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{message.body}</p>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.attachments.map((att) => (
                      <div key={att.id} className="rounded-xl border border-border overflow-hidden">
                        <div className="flex flex-col w-full">
                          {att.fileMimeType && att.fileMimeType.startsWith("image/") && thumbnails[att.id] ? (
                            <button type="button" onClick={() => void downloadAttachment(att.id)} className="w-full bg-muted/30 cursor-pointer">
                              <img src={thumbnails[att.id]} alt={att.fileName || "lampiran"} className="max-h-64 w-full object-contain" />
                            </button>
                          ) : (
                            <div className="p-1 rounded bg-muted/20 self-start">
                              <FileText className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-2.5 py-2">
                            <div className="min-w-0 text-xs font-medium text-foreground truncate">{att.fileName || "Lampiran"}</div>
                            <Button size="sm" variant="outline" onClick={() => void downloadAttachment(att.id)} disabled={downloadingId !== null} className="text-[11px]">
                              <Download className="mr-1 h-3.5 w-3.5 shrink-0" /> {downloadingId === att.id ? "Mencari..." : "Pratinjau / Perbesar"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex justify-end gap-2">
                  {(message.title.toLowerCase().includes("invoice") || message.title.toLowerCase().includes("tagihan") || message.body.toLowerCase().includes("invoice")) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-8 text-[11px]"
                      disabled={downloadingId !== null}
                      onClick={() => void handleTryDownloadInvoice(message.title, message.body)}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> {downloadingId ? "Mencari..." : "Lihat / Unduh"}
                    </Button>
                  )}
                  {!message.readAt && (
                    <Button size="sm" variant="outline" disabled={loading} onClick={() => void markRead(message.id)}>
                      <Check className="h-3.5 w-3.5" /> Tandai dibaca
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" disabled={loading} onClick={() => void remove(message.id)} className="text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-3xl max-h-[92dvh] overflow-y-auto rounded-2xl bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <div className="font-bold text-sm sm:text-base truncate">{preview.fileName || "Pratinjau Lampiran"}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a href={preview.url} download={preview.fileName} className="inline-flex items-center rounded-md border px-3 py-2 text-xs sm:text-sm font-medium">
                  Unduh
                </a>
                <button onClick={() => setPreview(null)} className="inline-flex items-center rounded-md border px-3 py-2 text-xs sm:text-sm font-medium">
                  Tutup
                </button>
              </div>
            </div>
            <div className="mt-3 flex justify-center bg-muted/30 rounded-xl p-2">
              {preview.mime === "application/pdf" ? (
                <iframe src={preview.url} title={preview.fileName || "PDF"} className="h-[60vh] w-full rounded-lg border" />
              ) : (
                <img src={preview.url} alt={preview.fileName} className="max-h-[70vh] w-full object-contain rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
