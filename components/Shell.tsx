import Link from "next/link";
import type { ReactNode } from "react";
import type { Site } from "@/lib/content";
import Header from "./Header";
import { CartDrawer } from "./Cart";
import { Icon, Social } from "./icons";

// Wraps every public page: announcement bar, header, footer and the theme colors
export default function Shell({ site, children }: { site: Site; children: ReactNode }) {
  const t = site.theme;
  const css = `:root{--ink:${t.ink};--paper:${t.paper};--ivory:${t.ivory};--beige:${t.beige};--line:${t.line};--r:${t.radius}px}`;
  const a = site.announcement;
  const f = site.footer;
  const socials = f.socials.filter((x) => x.url);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <a href="#main" className="skip">
        Aller au contenu
      </a>
      {a.visible && (a.items.length > 0 || a.script) ? (
        <div className="announce">
          <ul>
            {a.items.map((it, k) => (
              <li key={k}>
                {it.icon !== "none" ? <Icon name={it.icon} size={20} /> : null}
                <span>{it.text}</span>
              </li>
            ))}
          </ul>
          {a.script ? <p className="script">{a.script}</p> : null}
        </div>
      ) : null}
      <Header {...site.header} />
      <CartDrawer />
      <main id="main">{children}</main>

      <footer className="site-footer">
        <div className="ft-main">
          <div className="ft-cell ft-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.logo} alt="SA Collection" />
          </div>
          {f.groups.map((g, k) => (
            <div className="ft-cell ft-info" key={k}>
              {g.icon !== "none" ? <Icon name={g.icon} size={34} /> : null}
              <p>
                {g.line1}
                <br />
                {g.line2}
              </p>
            </div>
          ))}
          {f.message ? (
            <div className="ft-cell ft-msg">
              <p className="script">{f.message}</p>
            </div>
          ) : null}
        </div>
        <div className="ft-bottom">
          <p>{f.copyright}</p>
          {f.links.length > 0 ? (
            <nav aria-label="Informations légales">
              {f.links.map((l) => (
                <Link key={l.url + l.label} href={l.url}>
                  {l.label}
                </Link>
              ))}
            </nav>
          ) : null}
          {socials.length > 0 ? (
            <div className="ft-social">
              {socials.map((x) => (
                <a key={x.platform} href={x.url} target="_blank" rel="noopener noreferrer" aria-label={x.platform}>
                  <Social name={x.platform} size={22} />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </footer>
    </>
  );
}
