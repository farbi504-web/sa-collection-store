import { prisma } from "@/lib/db";
import { getStore } from "@/lib/content";
import { fmtDate } from "@/lib/format";
import Toast from "@/components/admin/Toast";
import { adjustStock } from "../actions";

export const dynamic = "force-dynamic";

export default async function Inventory({ searchParams }: { searchParams: { ok?: string; err?: string; low?: string } }) {
  const store = await getStore();
  const onlyLow = searchParams.low === "1";
  const [variants, moves] = await Promise.all([
    prisma.variant.findMany({
      where: { product: { status: { not: "ARCHIVED" } }, ...(onlyLow ? { stock: { lte: store.lowStock } } : {}) },
      orderBy: [{ stock: "asc" }],
      take: 300,
      include: { product: { select: { name: true } } }
    }),
    prisma.stockMovement.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { variant: { include: { product: { select: { name: true } } } } } })
  ]);

  return (
    <>
      <h1>المخزون</h1>
      <Toast ok={searchParams.ok} err={searchParams.err} />
      <div className="adm-actions">
        <a className={"btn small" + (onlyLow ? "" : " ghost")} href="/admin/inventory?low=1">منخفض فقط (≤ {store.lowStock})</a>
        <a className={"btn small" + (onlyLow ? " ghost" : "")} href="/admin/inventory">الكل</a>
      </div>
      {variants.length === 0 ? (
        <div className="panel"><p>{onlyLow ? "لا يوجد مخزون منخفض." : "لا توجد متغيرات بعد. أضفها من صفحة المنتج."}</p></div>
      ) : (
        <div className="panel tbl-wrap">
          <table className="tbl">
            <thead><tr><th>المنتج</th><th>المقاس / اللون</th><th>المخزون</th><th>تعديل (الكمية الجديدة + السبب)</th></tr></thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id}>
                  <td>{v.product.name}</td>
                  <td>{[v.size, v.color].filter(Boolean).join(" / ") || "-"}</td>
                  <td><strong>{v.stock}</strong>{v.stock === 0 ? " · نفد" : v.stock <= store.lowStock ? " · منخفض" : ""}</td>
                  <td>
                    <form action={adjustStock} className="toolbar" style={{ margin: 0 }}>
                      <input type="hidden" name="variantId" value={v.id} />
                      <input name="stock" type="number" min={0} defaultValue={v.stock} style={{ width: 90 }} aria-label="الكمية الجديدة" />
                      <input name="reason" placeholder="السبب" required maxLength={120} aria-label="السبب" />
                      <button className="btn small">حفظ</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <section className="panel">
        <h2>آخر حركات المخزون</h2>
        {moves.length === 0 ? (
          <p className="muted">لا توجد حركات بعد.</p>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>التاريخ</th><th>المنتج</th><th>قبل</th><th>بعد</th><th>السبب</th><th>المنفّذ</th></tr></thead>
              <tbody>
                {moves.map((m) => (
                  <tr key={m.id}>
                    <td>{fmtDate(m.createdAt)}</td>
                    <td>{m.variant.product.name} {[m.variant.size, m.variant.color].filter(Boolean).join("/")}</td>
                    <td>{m.before}</td><td>{m.after}</td><td>{m.reason}</td><td>{m.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
