import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Audit() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <h1>سجل العمليات</h1>
      {logs.length === 0 ? (
        <div className="panel"><p>لا توجد عمليات مسجّلة بعد.</p></div>
      ) : (
        <div className="panel tbl-wrap">
          <table className="tbl">
            <thead><tr><th>التاريخ</th><th>المنفّذ</th><th>العملية</th><th>العنصر</th><th>تفاصيل</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{fmtDate(l.createdAt)}</td>
                  <td>{l.actor}</td>
                  <td dir="ltr">{l.action}</td>
                  <td>{l.entity}</td>
                  <td>{l.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
