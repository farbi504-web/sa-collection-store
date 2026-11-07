import { NextResponse } from "next/server";
import { priceCart } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// Used by the checkout page to show real prices, stock and delivery fee before the order is placed
export async function POST(req: Request) {
  let body: { items?: { variantId?: unknown; qty?: unknown }[]; wilaya?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }
  const w = body.wilaya === undefined || body.wilaya === "" || body.wilaya === null ? undefined : Number(body.wilaya);
  const q = await priceCart((body.items ?? []).map((i) => ({ variantId: i.variantId, qty: i.qty })), w);
  return NextResponse.json(q, { status: q.ok ? 200 : 400 });
}
