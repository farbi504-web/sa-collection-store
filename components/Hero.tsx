"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./icons";

type Slide = { desktop: string; mobile: string; script: string; title: string; subtitle: string; ctaText: string; ctaUrl: string; side: "left" | "right" };

export default function Hero({ slides, autoplay, seconds }: { slides: Slide[]; autoplay: boolean; seconds: number }) {
  const [i, setI] = useState(0);
  const many = slides.length > 1;

  useEffect(() => {
    if (!autoplay || !many) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), seconds * 1000);
    return () => clearInterval(t);
  }, [autoplay, many, seconds, slides.length]);

  if (slides.length === 0) return null;
  const s = slides[Math.min(i, slides.length - 1)];
  const img = s.desktop || s.mobile;

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Bannière">
      <div className={"slide side-" + s.side} key={i}>
        {img ? (
          <picture>
            {s.mobile ? <source media="(max-width: 700px)" srcSet={s.mobile} /> : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="slide-img" src={img} alt="" />
          </picture>
        ) : null}
        <div className="slide-text">
          {s.script ? <p className="script">{s.script}</p> : null}
          {s.title ? <h1>{s.title}</h1> : null}
          {s.subtitle ? <p className="sub">{s.subtitle}</p> : null}
          {s.ctaText && s.ctaUrl ? (
            <Link href={s.ctaUrl} className="btn dark">
              {s.ctaText}
            </Link>
          ) : null}
        </div>
      </div>
      {many ? (
        <>
          <button className="hero-arrow l" onClick={() => setI((x) => (x - 1 + slides.length) % slides.length)} aria-label="Diapositive précédente">
            <Icon name="chevron-left" />
          </button>
          <button className="hero-arrow r" onClick={() => setI((x) => (x + 1) % slides.length)} aria-label="Diapositive suivante">
            <Icon name="chevron-right" />
          </button>
          <div className="dots">
            {slides.map((_, k) => (
              <button key={k} className={k === i ? "on" : ""} onClick={() => setI(k)} aria-label={`Diapositive ${k + 1}`} aria-current={k === i} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
