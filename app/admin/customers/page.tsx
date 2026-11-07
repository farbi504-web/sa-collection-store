import Link from "next/link";
import { prisma } from "@/lib/db";
import { dzd, fmtDate } from "@/lib/format";
import { wilayaName } from "@/lib/wilayas";

export const dynamic = "force-dynamic";

// Customers are built from orders and grouped by phone number (no separate customer accounts yet)
export default async function Customers({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q || "").trim().slice(0, 40).replace(/[\s.-]/g, "");
  const groups = await prisma.order.groupBy({
    by: ["phone"],
    where: q ? { OR: [{ phone: { contains: q } }, { customerName: { contains: q, mode: "insensitive" } }] } : undefined,
    _count: true,
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: "desc" } },
    take: 100
  });
  const phones = groups.map((g) => g.phone);
  const [latest, delivered] = await Promise.all([
    prisma.order.findMany({ where: { phone: { in: phones } }, orderBy: { createdAt: "desc" }, select: { phone: true, customerName: true, wilaya: true, commune: true } }),
    prisma.order.groupBy({ by: ["phone"], where: { phone: { in: phones }, status: "DELIVERED" }, _sum: { total: true }, _count: true })
  ]);
  const info = new Map<string, (typeof latest)[number]>();
  for (const o of latest) if (!info.has(o.phone)) info.set(o.phone, o);
  const dl = new Map(delivered.map((d) => [d.phone, d]));

  return (
    <>
      <h1>الزبائن</h1>
      <form className="toolbar" action="/admin/customers">
        <input name="q" defaultValue={searchParams.q} placeholder="اسم أو هاتف" />
        <button className="btn small">بحث</button>
      </form>
      {groups.length === 0 ? (
        <div className="panel"><p>لا يوجد زبائن بعد. يظهرون هنا بعد أول طلب.</p></div>
      ) : (
        <div className="panel tbl-wrap">
          <table className="tbl">
            <thead><tr><th>الاسم</th><th>الهاتف</th><th>الولاية</th><th>الطلبات</th><th>المُسلَّم</th><th>آخر طلب</th></tr></thead>
            <tbody>
              {groups.map((g) => {
                const i = info.get(g.phone);
                const d = dl.get(g.phone);
                return (
                  <tr key={g.phone}>
                    <td>{i?.customerName}</td>
                    <td dir="ltr"><Link href={`/admin/orders?q=${g.phone}`}>{g.phone}</Link></td>
                    <td>{i ? `${wilayaName(i.wilaya)} - ${i.commune}` : ""}</td>
                    <td>{g._count}</td>
                    <td>{d ? `${d._count} (${dzd(d._sum.total ?? 0)})` : "0"}</td>
                    <td>{g._max.createdAt ? fmtDate(g._max.createdAt) : ""}</td>
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
