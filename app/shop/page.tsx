import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSite } from "@/lib/content";
import Shell from "@/components/Shell";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Boutique" };

const PER = 12;
type SP = { q?: string; cat?: string; size?: string; color?: string; sort?: string; page?: string };

export default async function Shop({ searchParams }: { searchParams: SP }) {
  const { site } = await getSite(false);
  const q = (searchParams.q || "").trim().slice(0, 60);
  const cat = (searchParams.cat || "").slice(0, 60);
  const size = (searchParams.size || "").slice(0, 20);
  const color = (searchParams.color || "").slice(0, 30);
  const sort = ["new", "price_asc", "price_desc"].includes(searchParams.sort || "") ? (searchParams.sort as string) : "new";
  const page = Math.max(1, Math.min(500, parseInt(searchParams.page || "1", 10) || 1));

  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { shortDesc: { contains: q, mode: "insensitive" } }];
  if (cat) where.category = { slug: cat };
  const vf: Prisma.VariantWhereInput = {};
  if (size) vf.size = size;
  if (color) vf.color = color;
  if (size || color) where.variants = { some: { ...vf, stock: { gt: 0 } } };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "price_asc" ? [{ price: "asc" }] : sort === "price_desc" ? [{ price: "desc" }] : [{ sortOrder: "asc" }, { createdAt: "desc" }];

  const [total, products, cats, opts] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER,
      take: PER,
      include: { variants: { select: { id: true, size: true, color: true, stock: true } } }
    }),
    prisma.category.findMany({ where: { visible: true }, orderBy: { sortOrder: "asc" } }),
    prisma.variant.findMany({ where: { product: { status: "ACTIVE" }, stock: { gt: 0 } }, select: { size: true, color: true }, distinct: ["size", "color"] })
  ]);
  const sizes = [...new Set(opts.map((o) => o.size).filter(Boolean))];
  const colors = [...new Set(opts.map((o) => o.color).filter(Boolean))];
  const pages = Math.max(1, Math.ceil(total / PER));
  const link = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (cat) u.set("cat", cat);
    if (size) u.set("size", size);
    if (color) u.set("color", color);
    if (sort !== "new") u.set("sort", sort);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return "/shop" + (s ? "?" + s : "");
  };

  return (
    <Shell site={site}>
      <div className="container">
        <div className="page-head">
          <h1>Boutique</h1>
        </div>
        <form className="filters" action="/shop">
          <label>
            Recherche
            <input name="q" defaultValue={q} placeholder="Nom du produit" />
          </label>
          <label>
            Catégorie
            <select name="cat" defaultValue={cat}>
              <option value="">Toutes</option>
              {cats.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Taille
            <select name="size" defaultValue={size}>
              <option value="">Toutes</option>
              {sizes.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Couleur
            <select name="color" defaultValue={color}>
              <option value="">Toutes</option>
              {colors.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Trier par
            <select name="sort" defaultValue={sort}>
              <option value="new">Sélection</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </label>
          <button className="btn small">Filtrer</button>
        </form>

        {products.length === 0 ? (
          <div className="empty">
            <p>{q || cat || size || color ? "Aucun produit ne correspond à votre recherche." : "Les produits arrivent bientôt."}</p>
            {q || cat || size || color ? (
              <Link href="/shop" className="btn ghost">
                Effacer les filtres
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="shop-grid">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <nav className="pager" aria-label="Pagination">
            {Array.from({ length: pages }, (_, i) => i + 1).slice(0, 20).map((p) =>
              p === page ? (
                <span key={p} className="on" aria-current="page">
                  {p}
                </span>
              ) : (
                <Link key={p} href={link(p)}>
                  {p}
                </Link>
              )
            )}
          </nav>
        ) : null}
      </div>
    </Shell>
  );
}
