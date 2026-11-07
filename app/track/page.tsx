import { prisma } from "@/lib/db";
import { getSite } from "@/lib/content";
import { STATUS_LABEL_FR, fmtDate, dzd } from "@/lib/format";
import Shell from "@/components/Shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Suivre ma commande" };

export default async function Track({ searchParams }: { searchParams: { ref?: string; phone?: string } }) {
  const { site } = await getSite(false);
  const ref = (searchParams.ref || "").trim().toUpperCase().slice(0, 20);
  const phone = (searchParams.phone || "").replace(/[\s.-]/g, "").slice(0, 20);
  const asked = !!ref && !!phone;
  // the order is only shown when BOTH the reference and the phone number match
  const order = asked
    ? await prisma.order.findFirst({ where: { ref, phone }, include: { events: { orderBy: { createdAt: "asc" } }, items: true } })
    : null;

  return (
    <Shell site={site}>
      <div className="container" style={{ maxWidth: 640, paddingBottom: 48 }}>
        <div className="page-head">
          <h1>Suivre ma commande</h1>
        </div>
        <form action="/track" className="panel" style={{ border: "1px solid var(--line)", borderRadius: 6, padding: 18, margin: "16px 0" }}>
          <div className="two">
            <div className="field">
              <label htmlFor="ref">Numéro de commande</label>
              <input id="ref" name="ref" defaultValue={ref} placeholder="SA-XXXXXX" required />
            </div>
            <div className="field">
              <label htmlFor="phone">Téléphone</label>
              <input id="phone" name="phone" defaultValue={phone} inputMode="tel" required />
            </div>
          </div>
          <button className="btn">Voir le statut</button>
        </form>
        {asked && !order ? <p className="err">Aucune commande ne correspond à ces informations.</p> : null}
        {order ? (
          <div>
            <h2 style={{ fontSize: "1.8rem" }}>{STATUS_LABEL_FR[order.status]}</h2>
            <p className="muted">
              Commande {order.ref} du {fmtDate(order.createdAt)}. Total à la livraison : {dzd(order.total)}.
            </p>
            {order.trackingCode ? <p>Numéro de suivi transporteur : {order.trackingCode}</p> : null}
            <ul className="timeline">
              {order.events.map((e) => (
                <li key={e.id}>
                  <strong>{STATUS_LABEL_FR[e.to]}</strong>
                  <div className="muted small">{fmtDate(e.createdAt)}</div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
