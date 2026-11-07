import { prisma } from "@/lib/db";
import Toast from "@/components/admin/Toast";
import Confirm from "@/components/admin/Confirm";
import { saveReview, deleteReview } from "../actions";

export const dynamic = "force-dynamic";
const LABEL = { PENDING: "قيد المراجعة", APPROVED: "منشور", REJECTED: "مرفوض" } as const;

function Fields({ r }: { r?: { id: string; name: string; text: string; stars: number; photo: string; verified: boolean; status: string; sortOrder: number } }) {
  return (
    <>
      {r ? <input type="hidden" name="id" value={r.id} /> : null}
      <div className="adm-grid3">
        <div className="field"><label>اسم الزبونة</label><input name="name" defaultValue={r?.name} required maxLength={60} /></div>
        <div className="field"><label>النجوم</label><select name="stars" defaultValue={r?.stars ?? 5}>{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select></div>
        <div className="field"><label>الحالة</label>
          <select name="status" defaultValue={r?.status ?? "PENDING"}>
            <option value="APPROVED">منشور في الموقع</option>
            <option value="PENDING">قيد المراجعة</option>
            <option value="REJECTED">مرفوض</option>
          </select>
        </div>
      </div>
      <div className="field"><label>نص الرأي</label><textarea name="text" defaultValue={r?.text} required maxLength={400} rows={2} /></div>
      <div className="toolbar">
        <input name="photo" defaultValue={r?.photo} placeholder="رابط الصورة (اختياري)" dir="ltr" />
        <input name="sortOrder" type="number" defaultValue={r?.sortOrder ?? 0} style={{ width: 90 }} aria-label="الترتيب" />
        <label className="chk"><input type="checkbox" name="verified" defaultChecked={r?.verified} /> شراء مؤكَّد فعلاً</label>
        <button className="btn small">حفظ</button>
      </div>
    </>
  );
}

export default async function Reviews({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const reviews = await prisma.review.findMany({ orderBy: [{ createdAt: "desc" }] });
  return (
    <>
      <h1>آراء الزبائن</h1>
      <Toast ok={searchParams.ok} err={searchParams.err} />
      <p className="muted">أضف فقط آراء حقيقية وصلتك من زبائنك. لا يظهر في الموقع إلا الرأي بحالة «منشور». «شراء مؤكَّد» لا تفعّله إلا إذا طابقته مع طلب فعلي.</p>
      <section className="panel">
        <h2>رأي جديد</h2>
        <form action={saveReview}><Fields /></form>
      </section>
      {reviews.length === 0 ? <p className="muted">لا توجد آراء بعد.</p> : null}
      {reviews.map((r) => (
        <section className="panel" key={r.id}>
          <p><span className={"pillst " + r.status}>{LABEL[r.status]}</span></p>
          <form action={saveReview}><Fields r={r} /></form>
          <form action={deleteReview}><input type="hidden" name="id" value={r.id} /><Confirm message="حذف هذا الرأي؟">حذف</Confirm></form>
        </section>
      ))}
    </>
  );
}
