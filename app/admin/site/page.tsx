import { prisma } from "@/lib/db";
import { getDraftOrPublished } from "@/lib/content";
import { fmtDate } from "@/lib/format";
import Toast from "@/components/admin/Toast";
import { restoreVersionAction } from "../actions";
import SiteEditor from "./SiteEditor";

export const dynamic = "force-dynamic";

export default async function SitePage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const [{ site, hasDraft }, versions] = await Promise.all([
    getDraftOrPublished(),
    prisma.contentVersion.findMany({ where: { key: "site" }, orderBy: { createdAt: "desc" }, take: 15, select: { id: true, createdAt: true, note: true } })
  ]);
  return (
    <>
      <h1>تصميم الموقع</h1>
      <Toast ok={searchParams.ok} err={searchParams.err} />
      <SiteEditor initial={site} hasDraft={hasDraft} />
      <section className="panel" style={{ marginTop: 18 }}>
        <h2>النسخ السابقة (للتراجع)</h2>
        <p className="muted small">كل نشر يحفظ النسخة التي كانت منشورة قبله. الاسترجاع يحمّل النسخة كمسودة فقط، ولا يتغير الموقع حتى تنشرها.</p>
        {versions.length === 0 ? (
          <p className="muted">لا توجد نسخ سابقة بعد. تظهر بعد أول نشر.</p>
        ) : (
          <table className="tbl">
            <tbody>
              {versions.map((v) => (
                <tr key={v.id}>
                  <td>{fmtDate(v.createdAt)}</td>
                  <td>{v.note || "-"}</td>
                  <td>
                    <form action={restoreVersionAction}>
                      <input type="hidden" name="id" value={v.id} />
                      <button className="btn small ghost">استرجاع كمسودة</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
