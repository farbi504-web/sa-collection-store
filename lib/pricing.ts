import { prisma } from "./db";
import { getStore } from "./content";

export type QuoteLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  color: string;
  price: number;
  qty: number;
  stock: number;
};

export type Quote =
  | { ok: true; lines: QuoteLine[]; subtotal: number; deliveryFee: number | null; total: number | null; freeFrom: number }
  | { ok: false; error: string };

// All prices, stock and delivery fees come from the database. The browser only sends ids and quantities.
export async function priceCart(input: { variantId: unknown; qty: unknown }[], wilaya?: number): Promise<Quote> {
  if (!Array.isArray(input) || input.length < 1 || input.length > 20) return { ok: false, error: "Votre panier est vide." };

  const want = new Map<string, number>();
  for (const it of input) {
    const id = typeof it.variantId === "string" ? it.variantId.slice(0, 40) : "";
    const qty = Math.floor(Number(it.qty));
    if (!id || !Number.isInteger(qty) || qty < 1 || qty > 9) return { ok: false, error: "Quantité invalide." };
    want.set(id, (want.get(id) ?? 0) + qty);
  }

  const variants = await prisma.variant.findMany({ where: { id: { in: [...want.keys()] } }, include: { product: true } });
  const byId = new Map(variants.map((v) => [v.id, v]));
  const lines: QuoteLine[] = [];
  for (const [id, qty] of want) {
    const v = byId.get(id);
    if (!v || v.product.status !== "ACTIVE") return { ok: false, error: "Un article n'est plus disponible." };
    const label = v.product.name;
    if (v.stock < 1) return { ok: false, error: `Rupture de stock : ${label}.` };
    if (qty > v.stock) return { ok: false, error: `Il ne reste que ${v.stock} pièce(s) de ${label}.` };
    lines.push({
      variantId: v.id,
      productId: v.productId,
      slug: v.product.slug,
      name: label,
      image: v.product.images[0] ?? "",
      size: v.size,
      color: v.color,
      price: v.product.price,
      qty,
      stock: v.stock
    });
  }

  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const store = await getStore();
  let deliveryFee: number | null = null;
  if (wilaya !== undefined) {
    if (!Number.isInteger(wilaya) || wilaya < 1 || wilaya > 58) return { ok: false, error: "Wilaya invalide." };
    const row = await prisma.wilayaFee.findUnique({ where: { code: wilaya } });
    if (row && row.fee !== null) deliveryFee = store.freeShippingFrom > 0 && subtotal >= store.freeShippingFrom ? 0 : row.fee;
  }
  return { ok: true, lines, subtotal, deliveryFee, total: deliveryFee === null ? null : subtotal + deliveryFee, freeFrom: store.freeShippingFrom };
}
