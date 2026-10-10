"use client";

import * as React from "react";
import { ExternalLink, MapPin, Video } from "lucide-react";

const urlPatterns: Array<{ label: string; test: RegExp }> = [
  { label: "Zoom", test: /zoom\.us|zoommtg:|https?:\/\/[^\s]*zoom/i },
  { label: "Google Meet", test: /meet\.google\.com|https?:\/\/[^\s]*meet/i },
];

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (/^(https?:\/\/|zoommtg:|tel:|mailto:)/i.test(trimmed)) return trimmed;
  if (trimmed.includes(".") && !/\s/.test(trimmed)) return `https://${trimmed}`;
  return null;
}

export function isMeetingLink(value: string | null | undefined) {
  if (!value) return false;
  const url = normalizeUrl(value);
  if (!url) return false;
  return value.toLowerCase().includes("zoom") || value.toLowerCase().includes("meet") || /^https?:\/\//i.test(value);
}

export function renderRuanganLink(value: string | null | undefined, className = "text-primary underline hover:text-primary-700 inline-flex items-center gap-1") {
  if (!value) return <strong className="text-foreground">—</strong>;
  const url = normalizeUrl(value);
  if (!url) return <strong className="text-foreground">{value}</strong>;
  const detected = urlPatterns.find((pattern) => pattern.test.test(value))?.label;
  const Icon = detected === "Zoom" ? Video : ExternalLink;
  return (
    <a href={url} target="_blank" rel="noreferrer" className={className} onClick={(event) => event.stopPropagation()} title={`Open ${detected || "link"} in nieuw tabblad`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate max-w-56">{value}</span>
    </a>
  );
}