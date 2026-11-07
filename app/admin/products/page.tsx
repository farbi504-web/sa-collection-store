import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { dzd } from "@/lib/format";
import Toast from "@/components/admin/Toast";
import Confirm from "@/components/admin/Confirm";
import { duplicateProduct, setProductStatus, deleteProduct } from "../actions";

export const dynamic = "force-dynamic";
const LABEL = { DRAFT: "مسودة", ACTIVE: "مفعّل", ARCHIVED: "مؤرشف" } as const;

export default async function Products({ searchParams }: { searchParams: { q?: string; status?: string; ok?: string; err?: string } }) {
  const q = (searchParams.q || "").trim().slice(0, 60);
  const status = ["DRAFT", "ACTIVE", "ARCHIVED"].includes(searchParams.status || "") ? (searchParams.status as "DRAFT" | "ACTIVE" | "ARCHIVED") : undefined;
  const where: Prisma.ProductWhereInput = {};
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (status) where.status = status;
  const products = await prisma.product.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { category: true, variants: { select: { stock: true } } }
  });

  return (
    <>
      <h1>المنتجات</h1>
      <Toast ok={searchParams.ok} err={searchParams.err} />
      <form className="toolbar" action="/admin/products">
        <input name="q" defaultValue={q} placeholder="بحث بالاسم" />
        <select name="status" defaultValue={status ?? ""}>
          <option value="">كل الحالات</option>
          <option value="ACTIVE">مفعّل</option>
          <option value="DRAFT">مسودة</option>
          <option value="ARCHIVED">مؤرشف</option>
        </select>
        <button className="btn small">تصفية</button>
        <Link href="/admin/products/new" className="btn small">
          منتج جديد
        </Link>
      </form>
      {products.length === 0 ? (
        <div className="panel">
          <p>لا توجد منتجات. أضف أول منتج بصوره ومقاساته وألوانه ومخزونه.</p>
        </div>
      ) : (
        <div className="panel tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th></th><th>الاسم</th><th>القسم</th><th>السعر</th><th>المخزون</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const stock = p.variants.reduce((a, v) => a + v.stock, 0);
                return (
                  <tr key={p.id}>
                    <td>{p.images[0] ? /* eslint-disable-next-line @next/next/no-img-element */ <img className="thumb" src={p.images[0]} alt="" /> : <div className="thumb" />}</td>
                    <td><Link href={`/admin/products/${p.id}`}>{p.name}</Link></td>
                    <td>{p.category?.name ?? "-"}</td>
                    <td>{dzd(p.price)}</td>
                    <td>{stock}</td>
                    <td><span className={"pillst " + p.status}>{LABEL[p.status]}</span></td>
                    <td>
                      <div className="adm-actions" style={{ margin: 0 }}>
                        <form action={duplicateProduct}>
                          <input type="hidden" name="id" value={p.id} />
                          <button className="btn small ghost">نسخ</button>
                        </form>
                        <form action={setProductStatus}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="status" value={p.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE"} />
                          <button className="btn small ghost">{p.status === "ACTIVE" ? "أرشفة" : "تفعيل"}</button>
                        </form>
                        <form action={deleteProduct}>
                          <input type="hidden" name="id" value={p.id} />
                          <Confirm message="حذف هذا المنتج نهائياً؟">حذف</Confirm>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
