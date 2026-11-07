import { prisma } from "@/lib/db";
import { getStore } from "@/lib/content";
import { WILAYAS } from "@/lib/wilayas";
import Toast from "@/components/admin/Toast";
import { saveShipping } from "../actions";

export const dynamic = "force-dynamic";

export default async function Shipping({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const [store, rows] = await Promise.all([getStore(), prisma.wilayaFee.findMany()]);
  const fee = new Map(rows.map((r) => [r.code, r.fee]));
  const missing = WILAYAS.filter((_, i) => fee.get(i + 1) == null).length;

  return (
    <>
      <h1>التوصيل والإعدادات</h1>
      <Toast ok={searchParams.ok} err={searchParams.err} />
      <form action={saveShipping}>
        <section className="panel">
          <h2>إعدادات المتجر</h2>
          <div className="adm-grid2">
            <div className="field"><label>اسم المتجر</label><input name="name" defaultValue={store.name} maxLength={60} /></div>
            <div className="field"><label>رقم واتساب (بصيغة دولية بدون +، مثال 213550123456)</label><input name="whatsapp" defaultValue={store.whatsapp} dir="ltr" /></div>
            <div className="field"><label>توصيل مجاني ابتداءً من (DA، 0 = معطّل)</label><input name="freeShippingFrom" type="number" min={0} defaultValue={store.freeShippingFrom} /></div>
            <div className="field"><label>تنبيه المخزون المنخفض عند ≤</label><input name="lowStock" type="number" min={0} defaultValue={store.lowStock} /></div>
          </div>
        </section>

        <section className="panel">
          <h2>أسعار التوصيل حسب الولاية</h2>
          <p className="muted">الولاية التي سعرها فارغ تعتبر «غير متاحة» والزبون لا يستطيع إتمام الطلب إليها. {missing > 0 ? `حالياً ${missing} ولاية بدون سعر.` : "كل الولايات لها سعر."}</p>
          <div className="toolbar">
            <input name="applyAll" type="number" min={0} placeholder="سعر موحّد للولايات الفارغة" style={{ minWidth: 220 }} />
          </div>
          <div className="adm-grid3">
            {WILAYAS.map((w, i) => (
              <div className="field" key={w}>
                <label htmlFor={"fee_" + (i + 1)}>{String(i + 1).padStart(2, "0")} {w}</label>
                <input id={"fee_" + (i + 1)} name={"fee_" + (i + 1)} type="number" min={0} defaultValue={fee.get(i + 1) ?? ""} placeholder="غير متاح" />
              </div>
            ))}
          </div>
        </section>
        <button className="btn">حفظ</button>
      </form>

      <section className="panel" style={{ marginTop: 18 }}>
        <h2>ربط Anderson</h2>
        <p><span className="pillst">غير مُعدّ</span></p>
        <p className="muted">لم يُبنَ ربط API آلي لأن توثيق وبيانات دخول API الرسمية لحسابكم غير متوفرة، ولا أخترع مسارات. حالياً: أدخل الطلب المؤكَّد في موقع الشركة يدوياً، ثم سجّل رقم التتبع في صفحة الطلب وغيّر حالته إلى «تم الإرسال». عند توفر التوثيق الرسمي والمفتاح يُضاف المحوّل في ملف مخصص دون تغيير بقية النظام.</p>
      </section>
    </>
  );
}
