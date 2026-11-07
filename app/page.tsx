import Link from "next/link";
import type { CSSProperties } from "react";
import { prisma } from "@/lib/db";
import { getSite } from "@/lib/content";
import { getSession } from "@/lib/auth";
import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Botanical from "@/components/Botanical";
import { Social } from "@/components/icons";

export const dynamic = "force-dynamic";

function Title({ children }: { children: string }) {
  return (
    <div className="sec-title">
      <h2>{children}</h2>
    </div>
  );
}

export default async function Home({ searchParams }: { searchParams: { preview?: string } }) {
  // Only a signed-in admin can see the unpublished draft (?preview=1). Visitors always get the published version.
  const preview = searchParams.preview === "1" && !!(await getSession());
  const { site } = await getSite(preview);

  const needFav = site.sections.some((s) => s.id === "favorites" && s.visible);
  const needRev = site.sections.some((s) => s.id === "reviews" && s.visible);
  const [favorites, reviews] = await Promise.all([
    needFav
      ? prisma.product.findMany({
          where: { status: "ACTIVE", featured: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
          take: site.favorites.count,
          include: { variants: { select: { id: true, size: true, color: true, stock: true } } }
        })
      : Promise.resolve([]),
    needRev ? prisma.review.findMany({ where: { status: "APPROVED" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: 6 }) : Promise.resolve([])
  ]);

  const renderers: Record<string, () => JSX.Element | null> = {
    collection: () => {
      const cards = site.collection.cards.filter((c) => c.visible && c.url);
      if (cards.length === 0) return null;
      return (
        <section className="sec container" key="collection">
          {site.collection.heading ? <Title>{site.collection.heading}</Title> : null}
          <div className="tiles">
            {cards.map((c, k) => (
              <a key={k} className="tile" href={c.url} target="_blank" rel="noopener noreferrer">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="tile-bg" src={c.image} alt="" loading="lazy" />
                ) : null}
                <Social name={c.platform} size={46} className="soc" />
                <div className="tile-txt">
                  <strong>{c.title}</strong>
                  {c.button ? <span>{c.button}</span> : null}
                </div>
              </a>
            ))}
          </div>
        </section>
      );
    },
    favorites: () => {
      if (favorites.length === 0) return null;
      const sat = site.satisfaction;
      const showSat = sat.show && sat.percent;
      const style = { "--cols": site.favorites.columns, "--colsSat": Math.max(2, site.favorites.columns - 1) } as CSSProperties;
      return (
        <section className="sec container" key="favorites">
          {site.favorites.heading ? <Title>{site.favorites.heading}</Title> : null}
          <div className={"fav-wrap" + (showSat ? " has-sat" : "")}>
            <div className="fav" style={style}>
              {favorites.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
            {showSat ? (
              <div className="sat" style={sat.image ? { backgroundImage: `url(${sat.image})` } : undefined}>
                <div className="num">{sat.percent.replace(/%$/, "")}%</div>
                {sat.heading ? <p className="script">{sat.heading}</p> : null}
                <div className="stars" aria-hidden="true">
                  ★★★★★
                </div>
                {sat.description ? <p>{sat.description}</p> : null}
              </div>
            ) : null}
          </div>
        </section>
      );
    },
    reviews: () => {
      if (reviews.length === 0) return null;
      return (
        <section className="sec container" key="reviews">
          {site.reviews.heading ? <Title>{site.reviews.heading}</Title> : null}
          <div className="revs">
            {reviews.map((r) => (
              <figure className="rev" key={r.id} style={{ margin: 0 }}>
                {r.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photo} alt="" loading="lazy" />
                ) : (
                  <div className="av" />
                )}
                <div>
                  <div className="stars" aria-label={`${r.stars} sur 5`}>
                    {"★".repeat(r.stars)}
                    <span style={{ opacity: 0.25 }}>{"★".repeat(5 - r.stars)}</span>
                  </div>
                  <blockquote className="t" style={{ margin: "4px 0" }}>
                    <p className="t">« {r.text} »</p>
                  </blockquote>
                  <figcaption className="who">
                    {r.name}
                    {r.verified ? " · Achat vérifié" : ""}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </section>
      );
    },
    community: () => {
      const links = site.community.links.filter((l) => l.url);
      if (links.length === 0) return null;
      return (
        <section className="sec container community" key="community">
          {site.community.heading ? <Title>{site.community.heading}</Title> : null}
          <div className="pills">
            {links.map((l, k) => (
              <a key={k} className="pill" href={l.url} target="_blank" rel="noopener noreferrer">
                <Social name={l.platform} size={20} /> {l.label || l.platform}
              </a>
            ))}
          </div>
        </section>
      );
    }
  };

  return (
    <Shell site={site}>
      {site.hero.visible ? <Hero slides={site.hero.slides} autoplay={site.hero.autoplay} seconds={site.hero.seconds} /> : null}
      <div className="home-main">
        {site.sections.filter((s) => s.visible).map((s) => renderers[s.id]?.())}
        {site.ornament.show ? (
          <div className="orn-wrap" aria-hidden="true">
            <Botanical size={site.ornament.size} image={site.ornament.image} />
          </div>
        ) : null}
      </div>
      {!site.hero.visible && site.sections.every((s) => !s.visible) ? (
        <p className="container muted" style={{ padding: 40 }}>
          <Link href="/shop">Boutique</Link>
        </p>
      ) : null}
    </Shell>
  );
}
