"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; count?: number };

export default function AdminNav({ items }: { items: (Item | "sep")[] }) {
  const path = usePathname() || "";
  return (
    <>
      {items.map((it, i) =>
        it === "sep" ? (
          <div className="sep" key={i} />
        ) : (
          <Link key={it.href} href={it.href} className={path === it.href || (it.href !== "/admin" && path.startsWith(it.href)) ? "on" : ""}>
            <span>{it.label}</span>
            {it.count ? <span className="cnt">{it.count}</span> : null}
          </Link>
        )
      )}
    </>
  );
}
