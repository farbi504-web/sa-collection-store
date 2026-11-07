import Link from "next/link";
import { prisma } from "@/lib/db";
import { getStore } from "@/lib/content";
import { dzd, fmtDate, STATUS_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

const HOUR = 3600 * 1000;
// Algeria is UTC+1 all year
function startOfDay(offsetDays = 0) {
  const n = new Date(Date.now() + HOUR);
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + offsetDays) - HOUR);
}

const RANGES: Record<string, { label: string; from: () => Date; to: () => Date }> = {
  today: { label: "اليوم", from: () => startOfDay(0), to: () => startOfDay(1) },
  yesterday: { label: "أمس", from: () => startOfDay(-1), to: () => startOfDay(0) },
  "7d": { label: "آخر 7 أيام", from: () => startOfDay(-6), to: () => startOfDay(1) },
  "30d": { label: "آخر 30 يوماً", from: () => startOfDay(-29), to: () => startOfDay(1) },
  month: {
    label: "هذا الشهر",
    from: () => {
      const n = new Date(Date.now() + HOUR);
      return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1) - HOUR);
    },
    to: () => startOfDay(1)
  }
};

export default async function Dashboard({ searchParams }: { searchParams: { range?: string } }) {
  const key = searchParams.range && RANGES[searchParams.range] ? searchParams.range : "7d";
  const R = RANGES[key];
  const range = { gte: R.from(), lt: R.to() };
  const store = await getStore();

  const [byStatus, totalOrders, phones, lowStock, recent, orders, best] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where: { createdAt: range }, _count: true, _sum: { total: true } }),
    prisma.order.count(),
    prisma.order.groupBy({ by: ["phone"] }),
    prisma.variant.count({ where: { stock: { lte: store.lowStock }, product: { status: "ACTIVE" } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.order.findMany({ where: { createdAt: range }, select: { createdAt: true, total: true, status: true }, take: 5000 }),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: { order: { createdAt: range, status: { notIn: ["CANCELLED", "RETURNED"] } } },
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 5
    })
  ]);

  const st = (s: string) => byStatus.find((x) => x.status === s);
  const count = (s: string) => st(s)?._count ?? 0;
  const inRange = byStatus.reduce((a, x) => a + x._count, 0);
  const delivered = st("DELIVERED")?._sum.total ?? 0;
  const pipeline = ["CONFIRMED", "PREPARING", "READY", "SENT"].reduce((a, s) => a + (st(s)?._sum.total ?? 0), 0);
  const closed = count("DELIVERED") + count("RETURNED") + count("CANCELLED");
  const successRate = closed ? Math.round((count("DELIVERED") / closed) * 100) : null;

  // revenue per day (delivered orders only), Algeria time
  const perDay = new Map<string, number>();
  for (const o of orders) {
    if (o.status !== "DELIVERED") continue;
    const d = new Date(o.createdAt.getTime() + HOUR).toISOString().slice(0, 10);
    perDay.set(d, (perDay.get(d) ?? 0) + o.total);
  }
  const days = [...perDay.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const max = Math.max(1, ...days.map((d) => d[1]));

  return (
    <>
      <h1>نظرة عامة</h1>
      <div className="adm-actions">
        {Object.entries(RANGES).map(([k, v]) => (
          <Link key={k} href={`/admin?range=${k}`} className={"btn small" + (k === key ? "" : " ghost")}>
            {v.label}
          </Link>
        ))}
      </div>

      <div className="stats">
        <div className="stat"><b>{dzd(delivered)}</b><span>مبيعات مُسلَّمة ({R.label})</span></div>
        <div className="stat"><b>{dzd(pipeline)}</b><span>قيمة الطلبات الجارية</span></div>
        <div className="stat"><b>{inRange}</b><span>عدد الطلبات ({R.label})</span></div>
        <div className="stat"><b>{count("NEW")}</b><span>طلبات جديدة</span></div>
        <div className="stat"><b>{count("CONFIRMED")}</b><span>مؤكدة</span></div>
        <div className="stat"><b>{count("PREPARING") + count("READY")}</b><span>قيد التحضير / جاهزة</span></div>
        <div className="stat"><b>{count("SENT")}</b><span>تم إرسالها</span></div>
        <div className="stat"><b>{count("DELIVERED")}</b><span>تم تسليمها</span></div>
        <div className="stat"><b>{count("CANCELLED")}</b><span>ملغاة</span></div>
        <div className="stat"><b>{count("RETURNED")}</b><span>مرتجعة</span></div>
        <div className="stat"><b>{successRate === null ? "-" : successRate + "%"}</b><span>نسبة التسليم من المنتهية</span></div>
        <div className="stat"><b>{phones.length}</b><span>زبائن (أرقام هاتف مختلفة)</span></div>
        <div className="stat"><b>{totalOrders}</b><span>كل الطلبات</span></div>
        <div className="stat"><b>{lowStock}</b><span>متغيرات مخزونها ≤ {store.lowStock}</span></div>
      </div>

      <div className="adm-grid2">
        <section className="panel">
          <h2>المبيعات المُسلَّمة حسب اليوم</h2>
          {days.length === 0 ? (
            <p className="muted">لا توجد طلبات مُسلَّمة في هذه الفترة.</p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160, overflowX: "auto" }}>
              {days.map(([d, v]) => (
                <div key={d} title={`${d}: ${dzd(v)}`} style={{ display: "grid", gap: 4, justifyItems: "center", minWidth: 34 }}>
                  <div style={{ background: "var(--ink)", width: 22, height: Math.max(4, (v / max) * 120), borderRadius: 4 }} />
                  <span className="muted" style={{ fontSize: 10 }}>{d.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="panel">
          <h2>الأكثر مبيعاً ({R.label})</h2>
          {best.length === 0 ? (
            <p className="muted">لا توجد بيانات بعد.</p>
          ) : (
            <table className="tbl">
              <tbody>
                {best.map((b) => (
                  <tr key={b.name}>
                    <td>{b.name}</td>
                    <td>{b._sum.qty} قطعة</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="panel">
        <h2>آخر الطلبات</h2>
        {recent.length === 0 ? (
          <p className="muted">لا توجد طلبات بعد. ستظهر هنا فور وصول أول طلب.</p>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>الرقم</th><th>الزبون</th><th>المجموع</th><th>الحالة</th><th>التاريخ</th></tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/orders/${o.id}`}>{o.ref}</Link></td>
                    <td>{o.customerName}</td>
                    <td>{dzd(o.total)}</td>
                    <td><span className={"pillst " + o.status}>{STATUS_LABEL[o.status]}</span></td>
                    <td>{fmtDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="muted small">المبيعات المُسلَّمة = مجموع الطلبات بحالة «تم التسليم» فقط. كل الأرقام محسوبة من قاعدة البيانات.</p>
    </>
  );
}
