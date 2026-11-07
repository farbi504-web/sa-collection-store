// Hand-built botanical branch (SVG, no image file). Used at the bottom left of the homepage.
// A custom image can replace it from the site editor.
export default function Botanical({ size = 150, image = "" }: { size?: number; image?: string }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" width={size} height={size} className="orn" style={{ width: size, height: "auto" }} />;
  }
  const leaves: { x: number; y: number; r: number; l: number }[] = [];
  const N = 11;
  for (let i = 0; i < N; i++) {
    const t = (i + 0.6) / (N + 0.4);
    const x = 8 + 128 * t;
    const y = 118 - 100 * t - 16 * Math.sin(Math.PI * t);
    const side = i % 2 === 0 ? -1 : 1;
    const base = -42 - 26 * t;
    leaves.push({ x, y, r: base + side * 62, l: 15 - 5 * t });
  }
  const berries = [0.18, 0.42, 0.66].map((t) => ({
    x: 8 + 128 * t + 9,
    y: 118 - 100 * t - 16 * Math.sin(Math.PI * t) + 11
  }));
  return (
    <svg className="orn" viewBox="0 0 150 130" width={size} height={(size * 130) / 150} fill="none" stroke="currentColor" strokeWidth="0.9" aria-hidden="true" strokeLinecap="round">
      <path d="M8 118 C 40 112, 74 84, 140 16" />
      {leaves.map((lf, i) => (
        <g key={i} transform={`translate(${lf.x} ${lf.y}) rotate(${lf.r})`}>
          <path d={`M0 0 C ${lf.l * 0.35} ${-lf.l * 0.55}, ${lf.l * 0.9} ${-lf.l * 0.4}, ${lf.l} 0 C ${lf.l * 0.9} ${lf.l * 0.4}, ${lf.l * 0.35} ${lf.l * 0.55}, 0 0 Z`} />
          <path d={`M1 0 L ${lf.l * 0.85} 0`} strokeWidth="0.5" />
        </g>
      ))}
      {berries.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r="1.6" fill="currentColor" stroke="none" />
      ))}
    </svg>
  );
}
