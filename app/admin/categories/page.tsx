import { prisma } from "@/lib/db";
import Toast from "@/components/admin/Toast";
import Confirm from "@/components/admin/Confirm";
import { saveCategory, deleteCategory } from "../actions";

export const dynamic = "force-dynamic";

export default async function Categories({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const cats = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <>
      <h1>الأقسام</h1>
      <Toast ok={searchParams.ok} err={searchParams.err} />
      <section className="panel">
        <h2>قسم جديد</h2>
        <form action={saveCategory} className="toolbar">
          <input name="name" placeholder="الاسم (Robe, Ensemble...)" required />
          <input name="image" placeholder="رابط صورة (اختياري)" dir="ltr" />
          <input name="sortOrder" type="number" defaultValue={0} aria-label="الترتيب" style={{ width: 90 }} />
          <label className="chk"><input type="checkbox" name="visible" defaultChecked /> ظاهر</label>
          <button className="btn small">إضافة</button>
        </form>
      </section>
      {cats.length === 0 ? (
        <p className="muted">لا توجد أقسام بعد.</p>
      ) : (
        <section className="panel">
          {cats.map((c) => (
            <div className="card-item" key={c.id}>
              <form action={saveCategory} className="toolbar" style={{ marginBottom: 0 }}>
                <input type="hidden" name="id" value={c.id} />
                <input name="name" defaultValue={c.name} required />
                <input name="slug" defaultValue={c.slug} dir="ltr" aria-label="الرابط" />
                <input name="image" defaultValue={c.image} dir="ltr" placeholder="صورة" />
                <input name="sortOrder" type="number" defaultValue={c.sortOrder} style={{ width: 90 }} aria-label="الترتيب" />
                <label className="chk"><input type="checkbox" name="visible" defaultChecked={c.visible} /> ظاهر</label>
                <span className="muted small">{c._count.products} منتج</span>
                <button className="btn small">حفظ</button>
              </form>
              <form action={deleteCategory} style={{ marginTop: 6 }}>
                <input type="hidden" name="id" value={c.id} />
                <Confirm message="حذف القسم؟ المنتجات لن تُحذف.">حذف القسم</Confirm>
              </form>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
