import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSite } from "@/lib/content";
import Shell from "@/components/Shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await prisma.page.findFirst({ where: { slug: params.slug, published: true } }).catch(() => null);
  return p ? { title: p.title, description: p.seoDesc || undefined } : { title: "Page introuvable" };
}

// Plain-text pages written from the admin (shown as text, never as HTML)
export default async function InfoPage({ params }: { params: { slug: string } }) {
  const [{ site }, page] = await Promise.all([getSite(false), prisma.page.findFirst({ where: { slug: params.slug, published: true } })]);
  if (!page) notFound();
  return (
    <Shell site={site}>
      <div className="container">
        <div className="page-head">
          <h1>{page.title}</h1>
        </div>
        <div className="prose">{page.content}</div>
      </div>
    </Shell>
  );
}
