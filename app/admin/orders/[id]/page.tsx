import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { dzd, fmtDate, NEXT_STATUS, STATUS_LABEL } from "@/lib/format";
import { wilayaName } from "@/lib/wilayas";
import Toast from "@/components/admin/Toast";
import Confirm, { PrintButton } from "@/components/admin/Confirm";
import { updateOrderStatus, saveOrderMeta } from "../../actions";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string } }) {
  const o = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true, events: { orderBy: { createdAt: "desc" } } } });
  if (!o) notFound();
  const wa = "213" + o.phone.replace(/^0/, "");
  const next = NEXT_STATUS[o.status] ?? [];

  return (
    <>
      <div className="adm-actions no-print">
        <Link href="/admin/orders" className="btn small ghost">← الطلبات</Link>
        <PrintButton />
      </div>
      <h1>
        طلب {o.ref} <span className={"pillst " + o.status}>{STATUS_LABEL[o.status]}</span>
      </h1>
      <Toast ok={searchParams.ok} err={searchParams.err} />

      <div className="adm-grid2">
        <section className="panel">
          <h2>الزبون</h2>
          <p><strong>{o.customerName}</strong></p>
          <p dir="ltr" style={{ textAlign: "right" }}>{o.phone}{o.phone2 ? " / " + o.phone2 : ""}</p>
          <p>{wilayaName(o.wilaya)} - {o.commune}</p>
          <p>{o.address}</p>
          {o.notes ? <p className="muted">ملاحظة الزبون: {o.notes}</p> : null}
          <div className="adm-actions no-print">
            <a className="btn small" href={`tel:${o.phone}`}>اتصال</a>
            <a className="btn small ghost" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">واتساب</a>
          </div>
          <p className="muted small">تاريخ الطلب: {fmtDate(o.createdAt)}</p>
        </section>

        <section className="panel">
          <h2>المنتجات</h2>
          <table className="tbl">
            <tbody>
              {o.items.map((i) => (
                <tr key={i.id}>
                  <td>{i.name}<div className="muted small">{[i.size, i.color].filter(Boolean).join(" / ")}</div></td>
                  <td>× {i.qty}</td>
                  <td>{dzd(i.price * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 10 }}>المنتجات: {dzd(o.subtotal)}</p>
          <p>التوصيل: {dzd(o.deliveryFee)}</p>
          <p><strong>المبلغ عند التسليم: {dzd(o.total)}</strong></p>
        </section>
      </div>

      <section className="panel no-print">
        <h2>تغيير الحالة</h2>
        {next.length === 0 ? (
          <p className="muted">لا يوجد انتقال ممكن من هذه الحالة.</p>
        ) : (
          <form action={updateOrderStatus}>
            <input type="hidden" name="id" value={o.id} />
            <div className="field"><label htmlFor="note">ملاحظة (اختياري)</label><input id="note" name="note" maxLength={200} /></div>
            <div className="adm-actions">
              {next.map((s) => (
                <button key={s} name="to" value={s} className={"btn small" + (s === "CANCELLED" ? " danger" : "")} formNoValidate>
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </form>
        )}
        <p className="muted small">الإلغاء يُرجع الكميات إلى المخزون تلقائياً، وإعادة فتح الطلب الملغى تخصمها من جديد. «مرتجع» لا يُرجع المخزون تلقائياً: عدّله من صفحة المخزون بعد فحص القطع.</p>
      </section>

      <section className="panel no-print">
        <h2>التوصيل وملاحظات داخلية</h2>
        <form action={saveOrderMeta}>
          <input type="hidden" name="id" value={o.id} />
          <div className="field"><label htmlFor="trackingCode">رقم التتبع عند شركة التوصيل (يُدخل يدوياً)</label><input id="trackingCode" name="trackingCode" defaultValue={o.trackingCode} dir="ltr" maxLength={60} /></div>
          <div className="field"><label htmlFor="internalNotes">ملاحظات داخلية (لا تظهر للزبون)</label><textarea id="internalNotes" name="internalNotes" defaultValue={o.internalNotes} maxLength={1000} /></div>
          <button className="btn small">حفظ</button>
        </form>
        <p className="muted small">الربط الآلي مع Anderson غير مفعّل: لا يوجد توثيق API رسمي مؤكد لحسابكم. أدخل الطلب في موقع الشركة ثم سجّل رقم التتبع هنا.</p>
      </section>

      <section className="panel">
        <h2>سجل الطلب</h2>
        <ul className="timeline" style={{ display: "grid", gap: 8 }}>
          {o.events.map((e) => (
            <li key={e.id} style={{ borderRight: "2px solid var(--ink)", paddingRight: 10 }}>
              <strong>{e.from ? STATUS_LABEL[e.from] + " ← " : ""}{STATUS_LABEL[e.to]}</strong>
              <div className="muted small">{fmtDate(e.createdAt)} · {e.actor}{e.note ? " · " + e.note : ""}</div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
