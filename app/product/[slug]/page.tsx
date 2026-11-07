import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSite } from "@/lib/content";
import { dzd } from "@/lib/format";
import Shell from "@/components/Shell";
import Gallery from "@/components/Gallery";
import ProductBuy from "@/components/ProductBuy";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: { variants: { orderBy: [{ size: "asc" }, { color: "asc" }] }, category: true }
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await load(params.slug).catch(() => null);
  if (!p) return { title: "Produit introuvable" };
  const title = p.seoTitle || p.name;
  const description = p.seoDesc || p.shortDesc || undefined;
  return { title, description, openGraph: { title, description, images: p.images[0] ? [p.images[0]] : undefined } };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [{ site }, p] = await Promise.all([getSite(false), load(params.slug)]);
  if (!p) notFound();
  const off = p.comparePrice && p.comparePrice > p.price ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
  const variants = p.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock }));
  const soldOut = variants.every((v) => v.stock < 1);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.images,
    description: p.shortDesc || p.description.slice(0, 200),
    offers: { "@type": "Offer", priceCurrency: "DZD", price: p.price, availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" }
  };

  return (
    <Shell site={site}>
      <div className="container pdp">
        <Gallery images={p.images} name={p.name} />
        <div>
          {p.category ? <p className="muted small">{p.category.name}</p> : null}
          <h1>{p.name}</h1>
          <div className="price">
            <strong>{dzd(p.price)}</strong>
            {off > 0 && p.comparePrice ? (
              <>
                <s>{dzd(p.comparePrice)}</s>
                <span className="small">-{off}%</span>
              </>
            ) : null}
          </div>
          {p.shortDesc ? <p>{p.shortDesc}</p> : null}
          {p.description ? <div className="desc">{p.description}</div> : null}
          {soldOut ? <p className="notice">Ce produit est épuisé pour le moment.</p> : <ProductBuy productId={p.id} slug={p.slug} name={p.name} image={p.images[0] ?? ""} price={p.price} variants={variants} />}
          <p className="muted small" style={{ marginTop: 18 }}>
            Paiement à la livraison. Livraison dans les 58 wilayas selon disponibilité.
          </p>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </Shell>
  );
}
