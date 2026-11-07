"use client";

import { useState } from "react";

export default function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  if (images.length === 0) return <div className="ph gal-main" />;
  return (
    <div className="gallery">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="gal-main" src={images[i]} alt={name} />
      {images.length > 1 ? (
        <ul className="thumbs">
          {images.map((src, k) => (
            <li key={src + k}>
              <button onClick={() => setI(k)} aria-label={`Photo ${k + 1}`} aria-current={k === i} className={k === i ? "on" : ""}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
