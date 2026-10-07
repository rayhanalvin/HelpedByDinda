import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function validatePhone(v: string) {
  // basic normalisation: remove non-digit characters
  const digits = v.replace(/[^0-9+]/g, "");
  return digits.length >= 9 && digits.length <= 20 ? digits : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nama = String(body.nama || "").trim();
    const email = body.email ? String(body.email).trim() : null;
    const whatsappRaw = String(body.whatsapp || "").trim();
    const jenjang = body.jenjang ? String(body.jenjang).trim() : null;
    const pesan = String(body.pesan || "").trim();

    if (!nama || !whatsappRaw || !pesan) {
      return NextResponse.json({ ok: false, message: "Nama, WhatsApp, dan pesan wajib diisi." }, { status: 400 });
    }

    const whatsapp = validatePhone(whatsappRaw);
    if (!whatsapp) {
      return NextResponse.json({ ok: false, message: "Nomor WhatsApp tidak valid." }, { status: 400 });
    }

    const created = await prisma.contactMessage.create({
      data: {
        nama,
        email,
        whatsapp,
        jenjang,
        pesan,
      },
    });

    // enqueue background sync with WhatsApp provider (best-effort)
    // For now we call an internal helper route to forward the message.
    try {
      const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
      const apiToken = process.env.WHATSAPP_API_TOKEN;

      if (webhookUrl && apiToken) {
        // best-effort: call provider asynchronously, do not block response
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` },
          body: JSON.stringify({
            to: whatsapp,
            text: `Pesan dari ${nama} (${email || "tidak disertakan"}): ${pesan}`,
            metadata: { jenjang, source: "kontak-form" },
            localId: created.id,
          }),
        })
          .then(async (res) => {
            if (res.ok) {
              try {
                const json = await res.json();
                await prisma.contactMessage.update({ where: { id: created.id }, data: { isSynced: true, provider: "whatsapp", providerId: json.id || null } });
              } catch (e) {
                // ignore
              }
            }
          })
          .catch(() => {
            // ignore network errors
          });
      }
    } catch (e) {
      // swallow
    }

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
