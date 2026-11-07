import Link from "next/link";
import { prisma } from "@/lib/db";
import { dzd, fmtDate, STATUS_LABEL } from "@/lib/format";
import { wilayaName, WILAYAS } from "@/lib/wilayas";
import { orderWhere, STATUSES, type OrderFilters } from "@/lib/orderq";
import Toast from "@/components/admin/Toast";

export const dynamic = "force-dynamic";
const PER = 25;

export default async function Orders({ searchParams }: { searchParams: OrderFilters & { page?: string; ok?: string; err?: string } }) {
  const where = orderWhere(searchParams);
  const page = Math.max(1, Math.min(1000, parseInt(searchParams.page || "1", 10) || 1));
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER, include: { _count: { select: { items: true } } } })
  ]);
  const pages = Math.max(1, Math.ceil(total / PER));
  const qs = new URLSearchParams();
  for (const k of ["status", "q", "wilaya", "from", "to"] as const) if (searchParams[k]) qs.set(k, String(searchParams[k]));
  const base = qs.toString();

  return (
    <>
      <h1>الطلبات</h1>
      <Toast ok={searchParams.ok} err={searchParams.err} />
      <form className="toolbar" action="/admin/orders">
        <input name="q" defaultValue={searchParams.q} placeholder="رقم الطلب، اسم أو هاتف" />
        <select name="status" defaultValue={searchParams.status ?? ""}>
          <option value="">كل الحالات</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select name="wilaya" defaultValue={searchParams.wilaya ?? ""}>
          <option value="">كل الولايات</option>
          {WILAYAS.map((w, i) => <option key={w} value={i + 1}>{String(i + 1).padStart(2, "0")} {w}</option>)}
        </select>
        <input name="from" type="date" defaultValue={searchParams.from} aria-label="من" />
        <input name="to" type="date" defaultValue={searchParams.to} aria-label="إلى" />
        <button className="btn small">تصفية</button>
        <a className="btn small ghost" href={`/admin/orders/export${base ? "?" + base : ""}`}>تصدير CSV</a>
      </form>

      {orders.length === 0 ? (
        <div className="panel"><p>لا توجد طلبات مطابقة.</p></div>
      ) : (
        <div className="panel tbl-wrap">
          <table className="tbl">
            <thead><tr><th>الرقم</th><th>الزبون</th><th>الهاتف</th><th>الولاية</th><th>المجموع</th><th>الحالة</th><th>التاريخ</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders/${o.id}`}>{o.ref}</Link></td>
                  <td>{o.customerName}</td>
                  <td dir="ltr">{o.phone}</td>
                  <td>{wilayaName(o.wilaya)}</td>
                  <td>{dzd(o.total)}</td>
                  <td><span className={"pillst " + o.status}>{STATUS_LABEL[o.status]}</span></td>
                  <td>{fmtDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="adm-actions">
        <span className="muted">{total} طلب</span>
        {page > 1 ? <Link className="btn small ghost" href={`/admin/orders?${base}${base ? "&" : ""}page=${page - 1}`}>السابق</Link> : null}
        {page < pages ? <Link className="btn small ghost" href={`/admin/orders?${base}${base ? "&" : ""}page=${page + 1}`}>التالي</Link> : null}
      </div>
    </>
  );
}
