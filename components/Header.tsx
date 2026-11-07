"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { CartButton } from "./Cart";

type Props = {
  logo: string;
  logoHeight: number;
  links: { label: string; url: string }[];
  sticky: boolean;
  showSearch: boolean;
  showCart: boolean;
};

export default function Header({ logo, logoHeight, links, sticky, showSearch, showCart }: Props) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    <header className={"site-header" + (sticky ? " sticky" : "")}>
      <div className="hdr">
        <div className="hdr-l">
          <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Ouvrir le menu">
            <Icon name="menu" size={26} />
          </button>
        </div>
        <Link href="/" className="logo" aria-label="SA Collection, accueil">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="SA Collection" style={{ height: logoHeight }} />
        </Link>
        <div className="hdr-r">
          {showSearch ? (
            <form action="/shop" className={"search" + (search ? " on" : "")} role="search">
              <input name="q" type="search" placeholder="Rechercher" aria-label="Rechercher un produit" />
              <button type={search ? "submit" : "button"} className="icon-btn" aria-label="Rechercher" onClick={() => !search && setSearch(true)}>
                <Icon name="search" />
              </button>
            </form>
          ) : null}
          {showCart ? <CartButton /> : null}
        </div>
      </div>

      <div className={"scrim" + (menu ? " on" : "")} onClick={() => setMenu(false)} />
      <nav className={"drawer left" + (menu ? " on" : "")} aria-hidden={!menu} aria-label="Menu">
        <div className="drawer-head">
          <h2>Menu</h2>
          <button className="icon-btn" onClick={() => setMenu(false)} aria-label="Fermer le menu">
            <Icon name="close" />
          </button>
        </div>
        <ul className="menu-links">
          <li>
            <Link href="/" onClick={() => setMenu(false)}>
              Accueil
            </Link>
          </li>
          {links.map((l) => (
            <li key={l.url + l.label}>
              <Link href={l.url} onClick={() => setMenu(false)}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
