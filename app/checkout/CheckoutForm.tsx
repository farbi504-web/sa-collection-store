"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart, money } from "@/components/Cart";
import { WILAYAS } from "@/lib/wilayas";

type QLine = { variantId: string; name: string; size: string; color: string; price: number; qty: number; image: string };
type Quote = { ok: true; lines: QLine[]; subtotal: number; deliveryFee: number | null; total: number | null; freeFrom: number } | { ok: false; error: string };

export default function CheckoutForm() {
  const { items, ready, clear } = useCart();
  const [wilaya, setWilaya] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ ref: string; total: number } | null>(null);
  const idem = useRef("");

  // one key per checkout attempt: a double click or a retry can never create two orders
  useEffect(() => {
    if (!idem.current) idem.current = crypto.randomUUID();
  }, []);

  const sig = JSON.stringify(items.map((i) => [i.variantId, i.qty])) + "|" + wilaya;
  useEffect(() => {
    if (!ready || items.length === 0) {
      setQuote(null);
      return;
    }
    let off = false;
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })), wilaya: wilaya || undefined })
    })
      .then((r) => r.json())
      .then((q: Quote) => !off && setQuote(q))
      .catch(() => !off && setQuote({ ok: false, error: "Connexion impossible. Réessayez." }));
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, ready]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          phone: f.get("phone"),
          phone2: f.get("phone2"),
          wilaya: Number(f.get("wilaya")),
          commune: f.get("commune"),
          address: f.get("address"),
          notes: f.get("notes"),
          idemKey: idem.current,
          items: items.map((i) => ({ variantId: i.variantId, qty: i.qty }))
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        setBusy(false);
        return;
      }
      clear();
      setDone({ ref: data.ref, total: data.total });
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau puis réessayez.");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="done">
        <h2 style={{ fontSize: "2.2rem" }}>Merci pour votre commande</h2>
        <p>Votre numéro de commande</p>
        <p className="ref">{done.ref}</p>
        <p>
          Total à payer à la livraison : <strong>{money(done.total)}</strong>
        </p>
        <p className="muted">Gardez ce numéro : il vous permet de suivre votre commande avec votre téléphone. Nous vous contacterons pour la confirmer.</p>
        <Link href={`/track?ref=${done.ref}`} className="btn ghost">
          Suivre ma commande
        </Link>
      </div>
    );
  }

  if (ready && items.length === 0) {
    return (
      <div className="empty">
        <p>Votre panier est vide.</p>
        <Link href="/shop" className="btn">
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  const q = quote && quote.ok ? quote : null;
  const noFee = !!wilaya && q && q.deliveryFee === null;
  const canSubmit = !!q && q.deliveryFee !== null && !busy;

  return (
    <form className="checkout" onSubmit={submit}>
      <div>
        <div className="field">
          <label htmlFor="name">Nom complet</label>
          <input id="name" name="name" required maxLength={80} autoComplete="name" />
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="phone">Téléphone</label>
            <input id="phone" name="phone" required inputMode="tel" placeholder="05 50 12 34 56" autoComplete="tel" pattern="0[567][0-9\s.\-]{8,14}" title="Numéro algérien, ex. 0550123456" />
          </div>
          <div className="field">
            <label htmlFor="phone2">Second téléphone (facultatif)</label>
            <input id="phone2" name="phone2" inputMode="tel" />
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="wilaya">Wilaya</label>
            <select id="wilaya" name="wilaya" required value={wilaya} onChange={(e) => setWilaya(e.target.value)}>
              <option value="">Choisir</option>
              {WILAYAS.map((w, i) => (
                <option key={w} value={i + 1}>
                  {String(i + 1).padStart(2, "0")} - {w}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="commune">Commune</label>
            <input id="commune" name="commune" required maxLength={80} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="address">Adresse complète</label>
          <textarea id="address" name="address" required maxLength={300} />
        </div>
        <div className="field">
          <label htmlFor="notes">Remarque pour la livraison (facultatif)</label>
          <textarea id="notes" name="notes" maxLength={300} />
        </div>
        <p className="notice">Paiement en espèces à la livraison. Aucun paiement en ligne n&apos;est demandé.</p>
      </div>

      <aside className="summary" aria-live="polite">
        <h2>Récapitulatif</h2>
        {quote && !quote.ok ? (
          <p className="err">{quote.error}</p>
        ) : null}
        {q
          ? q.lines.map((l) => (
              <div className="sum-line" key={l.variantId}>
                <span>
                  {l.name}
                  <br />
                  <span className="muted small">
                    {[l.size, l.color].filter(Boolean).join(" / ")} × {l.qty}
                  </span>
                </span>
                <span>{money(l.price * l.qty)}</span>
              </div>
            ))
          : items.map((l) => (
              <div className="sum-line" key={l.variantId}>
                <span>{l.name}</span>
                <span className="muted">…</span>
              </div>
            ))}
        {q ? (
          <>
            <div className="sum-line" style={{ borderTop: "1px solid var(--line)", marginTop: 6, paddingTop: 10 }}>
              <span>Sous-total</span>
              <span>{money(q.subtotal)}</span>
            </div>
            <div className="sum-line">
              <span>Livraison</span>
              <span>{!wilaya ? "Choisissez votre wilaya" : q.deliveryFee === null ? "Indisponible" : q.deliveryFee === 0 ? "Offerte" : money(q.deliveryFee)}</span>
            </div>
            <div className="sum-line sum-total">
              <span>Total</span>
              <span>{q.total === null ? "-" : money(q.total)}</span>
            </div>
            {q.freeFrom > 0 ? <p className="muted small">Livraison offerte dès {money(q.freeFrom)} d&apos;achats.</p> : null}
          </>
        ) : null}
        {noFee ? <p className="err">La livraison vers cette wilaya n&apos;est pas encore disponible. Contactez-nous.</p> : null}
        {error ? (
          <p className="err" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn block" disabled={!canSubmit} style={{ marginTop: 14 }}>
          {busy ? "Envoi en cours…" : "Confirmer la commande"}
        </button>
      </aside>
    </form>
  );
}
