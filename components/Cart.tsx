"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Icon } from "./icons";

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  color: string;
  price: number;
  qty: number;
  max: number;
};

type Ctx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "sa_cart_v1";

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

export const money = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ")} DA`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.filter((x) => x && typeof x.variantId === "string" && x.qty > 0).slice(0, 20));
      }
    } catch {
      /* ignore broken storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage may be blocked */
    }
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((cur) => {
      const i = cur.findIndex((x) => x.variantId === item.variantId);
      if (i >= 0) {
        const next = [...cur];
        next[i] = { ...next[i], ...item, qty: Math.min(9, item.max, next[i].qty + qty) };
        return next;
      }
      return [...cur, { ...item, qty: Math.max(1, Math.min(9, item.max, qty)) }];
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    setItems((cur) => cur.map((x) => (x.variantId === variantId ? { ...x, qty: Math.max(1, Math.min(9, x.max, qty)) } : x)));
  }, []);
  const remove = useCallback((variantId: string) => setItems((cur) => cur.filter((x) => x.variantId !== variantId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(
    () => ({
      items,
      count: items.reduce((a, x) => a + x.qty, 0),
      subtotal: items.reduce((a, x) => a + x.qty * x.price, 0),
      ready,
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear
    }),
    [items, ready, open, add, setQty, remove, clear]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function CartButton() {
  const { count, setOpen, ready } = useCart();
  return (
    <button className="icon-btn" onClick={() => setOpen(true)} aria-label={`Panier, ${count} article(s)`}>
      <Icon name="bag" />
      {ready && count > 0 ? <span className="badge">{count}</span> : null}
    </button>
  );
}

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove, subtotal } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <>
      <div className={"scrim" + (open ? " on" : "")} onClick={() => setOpen(false)} />
      <aside className={"drawer right" + (open ? " on" : "")} aria-hidden={!open} aria-label="Panier">
        <div className="drawer-head">
          <h2>Votre panier</h2>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Fermer">
            <Icon name="close" />
          </button>
        </div>
        {items.length === 0 ? (
          <div className="empty">
            <p>Votre panier est vide.</p>
            <Link href="/shop" className="btn" onClick={() => setOpen(false)}>
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <>
            <ul className="cart-lines">
              {items.map((it) => (
                <li key={it.variantId}>
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt="" loading="lazy" />
                  ) : (
                    <div className="ph" />
                  )}
                  <div>
                    <Link href={`/product/${it.slug}`} onClick={() => setOpen(false)} className="cl-name">
                      {it.name}
                    </Link>
                    <div className="muted small">{[it.size, it.color].filter(Boolean).join(" / ")}</div>
                    <div className="cl-row">
                      <div className="qty">
                        <button onClick={() => setQty(it.variantId, it.qty - 1)} aria-label="Diminuer" disabled={it.qty <= 1}>
                          −
                        </button>
                        <span>{it.qty}</span>
                        <button onClick={() => setQty(it.variantId, it.qty + 1)} aria-label="Augmenter" disabled={it.qty >= Math.min(9, it.max)}>
                          +
                        </button>
                      </div>
                      <strong>{money(it.price * it.qty)}</strong>
                    </div>
                    <button className="link small" onClick={() => remove(it.variantId)}>
                      Retirer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="drawer-foot">
              <div className="row between">
                <span>Sous-total</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <p className="muted small">Frais de livraison calculés selon votre wilaya à l&apos;étape suivante.</p>
              <Link href="/checkout" className="btn block" onClick={() => setOpen(false)}>
                Commander
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
