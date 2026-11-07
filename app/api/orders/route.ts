import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { priceCart } from "@/lib/pricing";
import { newRef } from "@/lib/format";
import { wilayaName } from "@/lib/wilayas";

export const dynamic = "force-dynamic";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// light per-IP throttle (per server instance)
const hits = new Map<string, number[]>();
function throttled(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 12;
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (throttled(ip)) return NextResponse.json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const name = str(body.name, 80);
  const phone = str(body.phone, 20).replace(/[\s.-]/g, "");
  const phone2 = str(body.phone2, 20).replace(/[\s.-]/g, "");
  const wilaya = Number(body.wilaya);
  const commune = str(body.commune, 80);
  const address = str(body.address, 300);
  const notes = str(body.notes, 300);
  const idemKey = str(body.idemKey, 64);
  const items = Array.isArray(body.items) ? (body.items as { variantId?: unknown; qty?: unknown }[]) : [];

  if (!name) return NextResponse.json({ error: "Indiquez votre nom." }, { status: 400 });
  if (!/^0[567]\d{8}$/.test(phone)) return NextResponse.json({ error: "Numéro de téléphone invalide (ex. 0550123456)." }, { status: 400 });
  if (phone2 && !/^0[2567]\d{7,8}$/.test(phone2)) return NextResponse.json({ error: "Second numéro invalide." }, { status: 400 });
  if (!Number.isInteger(wilaya) || wilaya < 1 || wilaya > 58) return NextResponse.json({ error: "Choisissez votre wilaya." }, { status: 400 });
  if (!commune) return NextResponse.json({ error: "Indiquez votre commune." }, { status: 400 });
  if (!address) return NextResponse.json({ error: "Indiquez votre adresse." }, { status: 400 });
  if (!/^[A-Za-z0-9-]{16,64}$/.test(idemKey)) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  // A repeated submit with the same key returns the order already created
  const existing = await prisma.order.findUnique({ where: { idemKey } });
  if (existing) return NextResponse.json({ ref: existing.ref, total: existing.total, deliveryFee: existing.deliveryFee, duplicate: true });

  const quote = await priceCart(items, wilaya);
  if (!quote.ok) return NextResponse.json({ error: quote.error }, { status: 400 });
  if (quote.deliveryFee === null || quote.total === null) {
    return NextResponse.json({ error: `La livraison vers ${wilayaName(wilaya)} n'est pas encore disponible.` }, { status: 400 });
  }
  const { lines, subtotal, deliveryFee, total } = quote;

  let order;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      order = await prisma.$transaction(async (tx) => {
        // Atomic stock decrement: never goes below zero, even with simultaneous orders
        for (const l of lines) {
          const r = await tx.variant.updateMany({ where: { id: l.variantId, stock: { gte: l.qty } }, data: { stock: { decrement: l.qty } } });
          if (r.count === 0) throw new Error("STOCK");
          const v = await tx.variant.findUnique({ where: { id: l.variantId }, select: { stock: true } });
          const after = v?.stock ?? 0;
          await tx.stockMovement.create({ data: { variantId: l.variantId, before: after + l.qty, after, reason: "Commande en ligne", actor: "client" } });
        }
        const ref = newRef();
        return tx.order.create({
          data: {
            ref,
            idemKey,
            customerName: name,
            phone,
            phone2,
            wilaya,
            commune,
            address,
            notes,
            subtotal,
            deliveryFee,
            total,
            items: { create: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, name: l.name, size: l.size, color: l.color, qty: l.qty, price: l.price })) },
            events: { create: { to: "NEW", note: "Commande reçue", actor: "client" } }
          }
        });
      });
      break;
    } catch (e) {
      if (e instanceof Error && e.message === "STOCK") return NextResponse.json({ error: "Un article vient d'être épuisé. Mettez à jour votre panier." }, { status: 409 });
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const again = await prisma.order.findUnique({ where: { idemKey } });
        if (again) return NextResponse.json({ ref: again.ref, total: again.total, deliveryFee: again.deliveryFee, duplicate: true });
        continue; // reference collision, retry with a new one
      }
      return NextResponse.json({ error: "Impossible d'enregistrer la commande. Réessayez." }, { status: 500 });
    }
  }
  if (!order) return NextResponse.json({ error: "Impossible d'enregistrer la commande. Réessayez." }, { status: 500 });

  return NextResponse.json({ ref: order.ref, total: order.total, deliveryFee: order.deliveryFee });
}
