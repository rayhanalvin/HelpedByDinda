import * as React from "react";

type ParsedBlock =
  | { type: "heading2"; text: string; key: string }
  | { type: "heading3"; text: string; key: string }
  | { type: "quote"; text: string; key: string }
  | { type: "image"; src: string; alt: string; key: string }
  | { type: "paragraph"; text: string; key: string };

function parseContent(raw: string): ParsedBlock[] {
  const lines = raw.split(/\r?\n/);
  const blocks: ParsedBlock[] = [];
  let index = 0;
  for (const line of lines) {
    const key = `${index++}`;
    const trimmed = line.trim();
    if (!trimmed) continue;

    const imageMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imageMatch) {
      blocks.push({ type: "image", src: imageMatch[2], alt: imageMatch[1] || "Gambar", key });
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "heading2", text: trimmed.replace(/^##\s+/, ""), key });
      continue;
    }
    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "heading3", text: trimmed.replace(/^###\s+/, ""), key });
      continue;
    }
    if (trimmed.startsWith("> ")) {
      blocks.push({ type: "quote", text: trimmed.replace(/^>\s+/, ""), key });
      continue;
    }
    blocks.push({ type: "paragraph", text: trimmed, key });
  }
  return blocks;
}

function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^\*[^*]+\*$/.test(part)) {
      return (
        <em key={`${keyPrefix}-i-${i}`} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t-${i}`}>{part}</React.Fragment>;
  });
}

export function RichContent({ content, className }: { content: string; className?: string }) {
  const blocks = React.useMemo(() => parseContent(content), [content]);

  return (
    <div className={`space-y-5 ${className || ""}`}>
      {blocks.map((block) => {
        switch (block.type) {
          case "heading2":
            return (
              <h2 key={block.key} className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground pt-4 first:pt-0">
                {renderInline(block.text, block.key)}
              </h2>
            );
          case "heading3":
            return (
              <h3 key={block.key} className="text-lg sm:text-xl font-bold tracking-tight text-foreground pt-3 first:pt-0">
                {renderInline(block.text, block.key)}
              </h3>
            );
          case "quote":
            return (
              <blockquote key={block.key} className="border-l-4 border-primary bg-primary/5 rounded-r-xl px-4 py-3 text-sm sm:text-base italic text-foreground/80">
                {renderInline(block.text, block.key)}
              </blockquote>
            );
          case "image":
            return (
              <figure key={block.key} className="my-4 overflow-hidden rounded-2xl border border-border bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.src} alt={block.alt} className="w-full max-h-96 object-cover" loading="lazy" />
              </figure>
            );
          default:
            return (
              <p key={block.key} className="text-sm sm:text-base leading-8 text-foreground/90">
                {renderInline(block.text, block.key)}
              </p>
            );
        }
      })}
    </div>
  );
}