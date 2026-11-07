import { Prisma } from "@prisma/client";
import { prisma } from "./db";

export type IconName = "truck" | "gem" | "headset" | "shield" | "heart" | "none";
export type Platform = "instagram" | "tiktok" | "facebook" | "youtube";
export type SectionId = "collection" | "favorites" | "reviews" | "community";

export type Site = {
  announcement: { visible: boolean; items: { text: string; icon: IconName }[]; script: string };
  header: { logo: string; logoHeight: number; links: { label: string; url: string }[]; sticky: boolean; showSearch: boolean; showCart: boolean };
  hero: {
    visible: boolean;
    autoplay: boolean;
    seconds: number;
    slides: { desktop: string; mobile: string; script: string; title: string; subtitle: string; ctaText: string; ctaUrl: string; side: "left" | "right" }[];
  };
  sections: { id: SectionId; visible: boolean }[];
  collection: { heading: string; cards: { platform: Platform; title: string; button: string; url: string; image: string; visible: boolean }[] };
  favorites: { heading: string; count: number; columns: number };
  satisfaction: { show: boolean; percent: string; heading: string; description: string; image: string };
  reviews: { heading: string };
  community: { heading: string; links: { platform: Platform; label: string; url: string }[] };
  footer: {
    logo: string;
    groups: { icon: IconName; line1: string; line2: string }[];
    message: string;
    copyright: string;
    links: { label: string; url: string }[];
    socials: { platform: Platform; url: string }[];
  };
  ornament: { show: boolean; image: string; size: number };
  theme: { ink: string; paper: string; ivory: string; beige: string; line: string; radius: number };
};

export const DEFAULT_SITE: Site = {
  announcement: {
    visible: true,
    items: [
      { text: "Livraison partout en Algérie", icon: "truck" },
      { text: "Qualité & Élégance", icon: "gem" },
      { text: "Service client à l'écoute", icon: "headset" }
    ],
    script: "Merci de faire partie de notre histoire"
  },
  header: {
    logo: "/logo.png",
    logoHeight: 44,
    links: [
      { label: "Boutique", url: "/shop" },
      { label: "Suivre ma commande", url: "/track" }
    ],
    sticky: true,
    showSearch: true,
    showCart: true
  },
  hero: {
    visible: true,
    autoplay: true,
    seconds: 6,
    slides: [
      { desktop: "", mobile: "", script: "Welcome to", title: "SA collection", subtitle: "Plus qu'un style… une identité", ctaText: "Shop Now", ctaUrl: "/shop", side: "right" }
    ]
  },
  sections: [
    { id: "collection", visible: true },
    { id: "favorites", visible: true },
    { id: "reviews", visible: true },
    { id: "community", visible: true }
  ],
  collection: {
    heading: "New Collection",
    cards: [
      { platform: "instagram", title: "Instagram", button: "Découvrir", url: "", image: "", visible: true },
      { platform: "tiktok", title: "TikTok", button: "Découvrir", url: "", image: "", visible: true },
      { platform: "facebook", title: "Facebook", button: "Découvrir", url: "https://www.facebook.com/Sa.collection.dz", image: "", visible: true }
    ]
  },
  favorites: { heading: "Our Favorites", count: 4, columns: 4 },
  // Left empty and hidden on purpose: only show a figure you can back with real data
  satisfaction: { show: false, percent: "", heading: "client satisfait", description: "Votre confiance nous inspire chaque jour", image: "" },
  reviews: { heading: "Our Clients Satisfait" },
  community: {
    heading: "Join Our Community",
    links: [
      { platform: "instagram", label: "Instagram", url: "" },
      { platform: "facebook", label: "Facebook", url: "https://www.facebook.com/Sa.collection.dz" },
      { platform: "tiktok", label: "TikTok", url: "" }
    ]
  },
  footer: {
    logo: "/logo.png",
    groups: [
      { icon: "shield", line1: "Paiement", line2: "à la livraison" },
      { icon: "gem", line1: "Qualité", line2: "garantie" },
      { icon: "headset", line1: "Service client", line2: "à l'écoute" }
    ],
    message: "Merci de faire partie de notre histoire",
    copyright: "© SA Collection. Tous droits réservés.",
    links: [],
    socials: [
      { platform: "instagram", url: "" },
      { platform: "facebook", url: "https://www.facebook.com/Sa.collection.dz" },
      { platform: "tiktok", url: "" },
      { platform: "youtube", url: "" }
    ]
  },
  ornament: { show: true, image: "", size: 150 },
  theme: { ink: "#0a0a0a", paper: "#ffffff", ivory: "#f6f3ee", beige: "#e8dfd3", line: "#dcd6cd", radius: 6 }
};

// ---------- sanitizing (everything saved from the admin passes through here) ----------
type R = Record<string, unknown>;
const o = (v: unknown): R => (v && typeof v === "object" && !Array.isArray(v) ? (v as R) : {});
const arr = (v: unknown): R[] => (Array.isArray(v) ? v.map(o) : []);
const s = (v: unknown, d = "", max = 300) => (typeof v === "string" ? v.slice(0, max) : d);
const b = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
const n = (v: unknown, min: number, max: number, d: number) => {
  const x = Number(v);
  return Number.isFinite(x) ? Math.min(max, Math.max(min, Math.round(x))) : d;
};
const url = (v: unknown) => {
  const t = s(v, "", 1000).trim();
  if (!t) return "";
  if (/^\/\//.test(t)) return "";
  return /^(https?:\/\/|\/|mailto:|tel:)/i.test(t) ? t : "";
};
const color = (v: unknown, d: string) => (typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : d);
const pick = <T extends string>(v: unknown, list: readonly T[], d: T): T => (list.includes(v as T) ? (v as T) : d);

const ICONS = ["truck", "gem", "headset", "shield", "heart", "none"] as const;
const PLATFORMS = ["instagram", "tiktok", "facebook", "youtube"] as const;
const SECTION_IDS = ["collection", "favorites", "reviews", "community"] as const;

export function cleanSite(raw: unknown): Site {
  const D = DEFAULT_SITE;
  const r = o(raw);
  const has = (k: string) => r[k] !== undefined;

  const a = o(r.announcement);
  const h = o(r.header);
  const he = o(r.hero);
  const co = o(r.collection);
  const fa = o(r.favorites);
  const sa = o(r.satisfaction);
  const rv = o(r.reviews);
  const cm = o(r.community);
  const ft = o(r.footer);
  const orn = o(r.ornament);
  const th = o(r.theme);

  // sections: keep the saved order, add any missing id at the end
  const seen = new Set<string>();
  const sections: Site["sections"] = [];
  for (const x of arr(r.sections)) {
    const id = pick(x.id, SECTION_IDS, "collection");
    if (!(SECTION_IDS as readonly string[]).includes(String(x.id)) || seen.has(id)) continue;
    seen.add(id);
    sections.push({ id, visible: b(x.visible, true) });
  }
  for (const id of SECTION_IDS) if (!seen.has(id)) sections.push({ id, visible: true });

  return {
    announcement: {
      visible: b(a.visible, D.announcement.visible),
      items: has("announcement") && Array.isArray(a.items)
        ? arr(a.items).slice(0, 6).map((x) => ({ text: s(x.text, "", 80), icon: pick(x.icon, ICONS, "none") })).filter((x) => x.text)
        : D.announcement.items,
      script: has("announcement") ? s(a.script, "", 80) : D.announcement.script
    },
    header: {
      logo: has("header") ? url(h.logo) || D.header.logo : D.header.logo,
      logoHeight: n(h.logoHeight, 20, 90, D.header.logoHeight),
      links: has("header") && Array.isArray(h.links)
        ? arr(h.links).slice(0, 8).map((x) => ({ label: s(x.label, "", 40), url: url(x.url) })).filter((x) => x.label && x.url)
        : D.header.links,
      sticky: b(h.sticky, D.header.sticky),
      showSearch: b(h.showSearch, D.header.showSearch),
      showCart: b(h.showCart, D.header.showCart)
    },
    hero: {
      visible: b(he.visible, D.hero.visible),
      autoplay: b(he.autoplay, D.hero.autoplay),
      seconds: n(he.seconds, 2, 30, D.hero.seconds),
      slides: has("hero") && Array.isArray(he.slides)
        ? arr(he.slides).slice(0, 8).map((x) => ({
            desktop: url(x.desktop),
            mobile: url(x.mobile),
            script: s(x.script, "", 60),
            title: s(x.title, "", 80),
            subtitle: s(x.subtitle, "", 160),
            ctaText: s(x.ctaText, "", 40),
            ctaUrl: url(x.ctaUrl),
            side: pick(x.side, ["left", "right"] as const, "right")
          }))
        : D.hero.slides
    },
    sections,
    collection: {
      heading: has("collection") ? s(co.heading, "", 60) : D.collection.heading,
      cards: has("collection") && Array.isArray(co.cards)
        ? arr(co.cards).slice(0, 6).map((x) => ({
            platform: pick(x.platform, PLATFORMS, "instagram"),
            title: s(x.title, "", 40),
            button: s(x.button, "", 30),
            url: url(x.url),
            image: url(x.image),
            visible: b(x.visible, true)
          }))
        : D.collection.cards
    },
    favorites: {
      heading: has("favorites") ? s(fa.heading, "", 60) : D.favorites.heading,
      count: n(fa.count, 1, 12, D.favorites.count),
      columns: n(fa.columns, 2, 5, D.favorites.columns)
    },
    satisfaction: {
      show: b(sa.show, D.satisfaction.show),
      percent: s(sa.percent, D.satisfaction.percent, 6).replace(/[^0-9.,%]/g, ""),
      heading: has("satisfaction") ? s(sa.heading, "", 60) : D.satisfaction.heading,
      description: has("satisfaction") ? s(sa.description, "", 120) : D.satisfaction.description,
      image: url(sa.image)
    },
    reviews: { heading: has("reviews") ? s(rv.heading, "", 60) : D.reviews.heading },
    community: {
      heading: has("community") ? s(cm.heading, "", 60) : D.community.heading,
      links: has("community") && Array.isArray(cm.links)
        ? arr(cm.links).slice(0, 6).map((x) => ({ platform: pick(x.platform, PLATFORMS, "instagram"), label: s(x.label, "", 30), url: url(x.url) }))
        : D.community.links
    },
    footer: {
      logo: has("footer") ? url(ft.logo) || D.footer.logo : D.footer.logo,
      groups: has("footer") && Array.isArray(ft.groups)
        ? arr(ft.groups).slice(0, 4).map((x) => ({ icon: pick(x.icon, ICONS, "none"), line1: s(x.line1, "", 40), line2: s(x.line2, "", 40) }))
        : D.footer.groups,
      message: has("footer") ? s(ft.message, "", 100) : D.footer.message,
      copyright: has("footer") ? s(ft.copyright, "", 120) : D.footer.copyright,
      links: has("footer") && Array.isArray(ft.links)
        ? arr(ft.links).slice(0, 8).map((x) => ({ label: s(x.label, "", 40), url: url(x.url) })).filter((x) => x.label && x.url)
        : D.footer.links,
      socials: has("footer") && Array.isArray(ft.socials)
        ? arr(ft.socials).slice(0, 6).map((x) => ({ platform: pick(x.platform, PLATFORMS, "instagram"), url: url(x.url) }))
        : D.footer.socials
    },
    ornament: { show: b(orn.show, D.ornament.show), image: url(orn.image), size: n(orn.size, 60, 320, D.ornament.size) },
    theme: {
      ink: color(th.ink, D.theme.ink),
      paper: color(th.paper, D.theme.paper),
      ivory: color(th.ivory, D.theme.ivory),
      beige: color(th.beige, D.theme.beige),
      line: color(th.line, D.theme.line),
      radius: n(th.radius, 0, 24, D.theme.radius)
    }
  };
}

// ---------- read / write ----------
export async function getSite(preview = false): Promise<{ site: Site; hasDraft: boolean }> {
  const row = await prisma.siteContent.findUnique({ where: { key: "site" } }).catch(() => null);
  if (preview && row?.draft) return { site: cleanSite(row.draft), hasDraft: true };
  return { site: cleanSite(row?.published), hasDraft: !!row?.draft };
}

export async function getDraftOrPublished(): Promise<{ site: Site; hasDraft: boolean }> {
  return getSite(true);
}

const asJson = (v: unknown) => v as Prisma.InputJsonValue;

export async function saveDraft(raw: unknown) {
  const clean = cleanSite(raw);
  await prisma.siteContent.upsert({
    where: { key: "site" },
    create: { key: "site", published: asJson(DEFAULT_SITE), draft: asJson(clean) },
    update: { draft: asJson(clean) }
  });
  return clean;
}

export async function publishDraft(note = "") {
  const row = await prisma.siteContent.findUnique({ where: { key: "site" } });
  if (!row?.draft) throw new Error("NO_DRAFT");
  await prisma.$transaction([
    prisma.contentVersion.create({ data: { key: "site", data: asJson(row.published), note: note.slice(0, 120) } }),
    prisma.siteContent.update({ where: { key: "site" }, data: { published: asJson(cleanSite(row.draft)), draft: Prisma.DbNull } })
  ]);
  const old = await prisma.contentVersion.findMany({ where: { key: "site" }, orderBy: { createdAt: "desc" }, skip: 30, select: { id: true } });
  if (old.length) await prisma.contentVersion.deleteMany({ where: { id: { in: old.map((x) => x.id) } } });
}

export async function discardDraft() {
  await prisma.siteContent.updateMany({ where: { key: "site" }, data: { draft: Prisma.DbNull } });
}

// Rollback loads an old version into the draft. Nothing changes publicly until it is published.
export async function restoreVersionToDraft(id: string) {
  const v = await prisma.contentVersion.findUnique({ where: { id } });
  if (!v || v.key !== "site") throw new Error("NOT_FOUND");
  await saveDraft(v.data);
}

// ---------- store settings (no draft: operational values) ----------
export type Store = { name: string; whatsapp: string; freeShippingFrom: number; lowStock: number };
export const DEFAULT_STORE: Store = { name: "SA Collection", whatsapp: "", freeShippingFrom: 0, lowStock: 3 };

export function cleanStore(raw: unknown): Store {
  const r = o(raw);
  return {
    name: s(r.name, DEFAULT_STORE.name, 60) || DEFAULT_STORE.name,
    whatsapp: s(r.whatsapp, "", 20).replace(/[^0-9]/g, ""),
    freeShippingFrom: n(r.freeShippingFrom, 0, 10_000_000, 0),
    lowStock: n(r.lowStock, 0, 1000, DEFAULT_STORE.lowStock)
  };
}

export async function getStore(): Promise<Store> {
  const row = await prisma.siteContent.findUnique({ where: { key: "store" } }).catch(() => null);
  return cleanStore(row?.published);
}

export async function saveStore(raw: unknown) {
  const clean = cleanStore(raw);
  await prisma.siteContent.upsert({
    where: { key: "store" },
    create: { key: "store", published: asJson(clean) },
    update: { published: asJson(clean) }
  });
  return clean;
}
