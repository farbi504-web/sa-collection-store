import { prisma } from "@/lib/db";
import Toast from "@/components/admin/Toast";
import Confirm from "@/components/admin/Confirm";
import { savePage, deletePage } from "../actions";

export const dynamic = "force-dynamic";

export default async function PagesAdmin({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const pages = await prisma.page.findMany({ orderBy: { title: "asc" } });
  return (
    <>
      <h1>الصفحات</h1>
      <Toast ok={searchParams.ok} err={searchParams.err} />
      <p className="muted">صفحات نصية (من نحن، سياسة الخصوصية، التوصيل، الإرجاع...). اكتب المحتوى بنفسك: لا يوجد نص قانوني جاهز. للظهور في أسفل الموقع أضف رابطها (/p/الرابط) من «تصميم الموقع ← الفوتر».</p>
      <section className="panel">
        <h2>صفحة جديدة</h2>
        <form action={savePage}>
          <div className="adm-grid2">
            <div className="field"><label>العنوان</label><input name="title" required maxLength={100} /></div>
            <div className="field"><label>الرابط (اختياري)</label><input name="slug" dir="ltr" placeholder="a-propos" /></div>
          </div>
          <div className="field"><label>المحتوى (نص عادي)</label><textarea name="content" rows={6} /></div>
          <label className="chk"><input type="checkbox" name="published" /> منشورة</label>
          <button className="btn small">إنشاء</button>
        </form>
      </section>
      {pages.map((p) => (
        <section className="panel" key={p.id}>
          <h2>{p.title} <span className="muted small" dir="ltr">/p/{p.slug}</span> {p.published ? <span className="pillst ACTIVE">منشورة</span> : <span className="pillst">مسودة</span>}</h2>
          <form action={savePage}>
            <input type="hidden" name="id" value={p.id} />
            <div className="field"><label>العنوان</label><input name="title" defaultValue={p.title} required maxLength={100} /></div>
            <div className="field"><label>المحتوى</label><textarea name="content" rows={8} defaultValue={p.content} /></div>
            <div className="field"><label>وصف SEO</label><input name="seoDesc" defaultValue={p.seoDesc} maxLength={200} /></div>
            <label className="chk"><input type="checkbox" name="published" defaultChecked={p.published} /> منشورة</label>
            <button className="btn small">حفظ</button>
          </form>
          <form action={deletePage} style={{ marginTop: 8 }}><input type="hidden" name="id" value={p.id} /><Confirm message="حذف الصفحة؟">حذف</Confirm></form>
        </section>
      ))}
    </>
  );
}
