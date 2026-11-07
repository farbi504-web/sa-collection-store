"use client";

import { useMemo, useState } from "react";
import { useCart } from "./Cart";

type V = { id: string; size: string; color: string; stock: number };
type Props = { productId: string; slug: string; name: string; image: string; price: number; variants: V[] };

export default function ProductBuy({ productId, slug, name, image, price, variants }: Props) {
  const { add } = useCart();
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size).filter(Boolean))], [variants]);
  const colors = useMemo(() => [...new Set(variants.map((v) => v.color).filter(Boolean))], [variants]);
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : "");
  const [color, setColor] = useState(colors.length === 1 ? colors[0] : "");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");

  const sel = variants.find((v) => v.size === (sizes.length ? size : "") && v.color === (colors.length ? color : ""));
  const stockFor = (s: string, c: string) => variants.filter((v) => (!s || v.size === s) && (!c || v.color === c)).reduce((a, v) => a + v.stock, 0);

  function submit() {
    setMsg("");
    if (sizes.length && !size) return setMsg("Choisissez une taille.");
    if (colors.length && !color) return setMsg("Choisissez une couleur.");
    if (!sel || sel.stock < 1) return setMsg("Cette combinaison n'est plus disponible.");
    add({ variantId: sel.id, productId, slug, name, image, size: sel.size, color: sel.color, price, max: sel.stock }, qty);
  }

  return (
    <div className="buy">
      {sizes.length > 0 ? (
        <fieldset>
          <legend>Taille</legend>
          <div className="opts">
            {sizes.map((s) => {
              const out = stockFor(s, color) < 1;
              return (
                <button key={s} type="button" className={"opt" + (size === s ? " on" : "")} disabled={out} onClick={() => setSize(s)} aria-pressed={size === s}>
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      {colors.length > 0 ? (
        <fieldset>
          <legend>Couleur</legend>
          <div className="opts">
            {colors.map((c) => {
              const out = stockFor(size, c) < 1;
              return (
                <button key={c} type="button" className={"opt" + (color === c ? " on" : "")} disabled={out} onClick={() => setColor(c)} aria-pressed={color === c}>
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      {sel ? (
        <p className="muted small">{sel.stock <= 3 && sel.stock > 0 ? `Plus que ${sel.stock} en stock` : sel.stock > 0 ? "En stock" : "Épuisé"}</p>
      ) : null}
      <div className="buy-row">
        <div className="qty">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuer" disabled={qty <= 1}>
            −
          </button>
          <span>{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(9, sel ? sel.stock : 9, q + 1))} aria-label="Augmenter">
            +
          </button>
        </div>
        <button type="button" className="btn grow" onClick={submit}>
          Ajouter au panier
        </button>
      </div>
      {msg ? (
        <p className="err" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
