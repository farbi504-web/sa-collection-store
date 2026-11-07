import Link from "next/link";
import QuickAdd from "./QuickAdd";
import { dzd } from "@/lib/format";

export type CardProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  isNew: boolean;
  variants: { id: string; size: string; color: string; stock: number }[];
};

export default function ProductCard({ p }: { p: CardProduct }) {
  const inStock = p.variants.filter((v) => v.stock > 0);
  const sizes = [...new Set(inStock.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(inStock.map((v) => v.color).filter(Boolean))];
  const sold = inStock.length === 0;
  const off = p.comparePrice && p.comparePrice > p.price ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
  const single = inStock.length === 1 ? inStock[0] : null;

  return (
    <article className="card">
      <Link href={`/product/${p.slug}`} className="card-img" aria-label={p.name}>
        {p.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.images[0]} alt={p.name} loading="lazy" />
        ) : (
          <div className="ph" />
        )}
        <span className="tags">
          {off > 0 ? <em>-{off}%</em> : null}
          {p.isNew ? <em>Nouveau</em> : null}
          {sold ? <em className="out">Épuisé</em> : null}
        </span>
      </Link>
      <div className="card-body">
        <Link href={`/product/${p.slug}`} className="card-name">
          {p.name}
        </Link>
        <div className="price">
          <strong>{dzd(p.price)}</strong>
          {off > 0 && p.comparePrice ? <s>{dzd(p.comparePrice)}</s> : null}
        </div>
        {sizes.length > 0 ? (
          <ul className="chips" aria-label="Tailles disponibles">
            {sizes.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : null}
        {colors.length > 0 ? <p className="muted small">{colors.join(", ")}</p> : null}
        <div className="card-act">
          {sold ? (
            <span className="muted small">Indisponible</span>
          ) : single ? (
            <QuickAdd
              item={{
                variantId: single.id,
                productId: p.id,
                slug: p.slug,
                name: p.name,
                image: p.images[0] ?? "",
                size: single.size,
                color: single.color,
                price: p.price,
                max: single.stock
              }}
            />
          ) : (
            <Link href={`/product/${p.slug}`} className="btn small ghost">
              Choisir
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
