import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Toast from "@/components/admin/Toast";
import ProductForm from "./ProductForm";

export const dynamic = "force-dynamic";

export default async function ProductEdit({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string } }) {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  const p =
    params.id === "new"
      ? null
      : await prisma.product.findUnique({ where: { id: params.id }, include: { variants: { orderBy: [{ size: "asc" }, { color: "asc" }] } } });
  if (params.id !== "new" && !p) notFound();

  return (
    <>
      <h1>{p ? "تعديل: " + p.name : "منتج جديد"}</h1>
      <Toast ok={searchParams.ok} err={searchParams.err} />
      <ProductForm
        categories={categories}
        product={
          p
            ? {
                id: p.id,
                name: p.name,
                slug: p.slug,
                categoryId: p.categoryId ?? "",
                price: p.price,
                comparePrice: p.comparePrice,
                shortDesc: p.shortDesc,
                description: p.description,
                status: p.status,
                featured: p.featured,
                isNew: p.isNew,
                bestSeller: p.bestSeller,
                sortOrder: p.sortOrder,
                seoTitle: p.seoTitle,
                seoDesc: p.seoDesc,
                images: p.images,
                variants: p.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, sku: v.sku, stock: v.stock }))
              }
            : null
        }
      />
    </>
  );
}
