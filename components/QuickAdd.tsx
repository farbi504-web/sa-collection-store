"use client";

import { useCart, type CartItem } from "./Cart";
import { Icon } from "./icons";

export default function QuickAdd({ item }: { item: Omit<CartItem, "qty"> }) {
  const { add } = useCart();
  return (
    <button className="btn small" onClick={() => add(item, 1)} aria-label={`Ajouter ${item.name} au panier`}>
      <Icon name="bag" size={16} /> Ajouter
    </button>
  );
}
