import type { ReactElement } from "react";

type P = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true
});

export function Icon({ name, size = 22, className }: P & { name: string }): ReactElement | null {
  const c = base(size);
  switch (name) {
    case "truck":
      return (
        <svg {...c} className={className}>
          <path d="M2 6h11v9H2zM13 9h4l3 3v3h-7z" />
          <circle cx="6" cy="17" r="1.6" />
          <circle cx="16.5" cy="17" r="1.6" />
        </svg>
      );
    case "gem":
      return (
        <svg {...c} className={className}>
          <path d="M6 4h12l3 5-9 11L3 9z" />
          <path d="M3 9h18M9 4L7 9l5 11 5-11-2-5" />
        </svg>
      );
    case "headset":
      return (
        <svg {...c} className={className}>
          <path d="M4 14v-2a8 8 0 0116 0v2" />
          <rect x="3" y="14" width="4" height="6" rx="1.5" />
          <rect x="17" y="14" width="4" height="6" rx="1.5" />
          <path d="M19 20c0 1.5-2 2-5 2" />
        </svg>
      );
    case "shield":
      return (
        <svg {...c} className={className}>
          <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "heart":
      return (
        <svg {...c} className={className}>
          <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />
        </svg>
      );
    case "search":
      return (
        <svg {...c} className={className}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
      );
    case "bag":
      return (
        <svg {...c} className={className}>
          <path d="M5 8h14l-1 12H6z" />
          <path d="M9 8V6.5a3 3 0 016 0V8" />
        </svg>
      );
    case "menu":
      return (
        <svg {...c} className={className}>
          <path d="M3 7h18M3 12h18M3 17h18" />
        </svg>
      );
    case "close":
      return (
        <svg {...c} className={className}>
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...c} className={className}>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...c} className={className}>
          <path d="M9 5l7 7-7 7" />
        </svg>
      );
    default:
      return null;
  }
}

export function Social({ name, size = 22, className }: P & { name: string }): ReactElement | null {
  const f = { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, className };
  switch (name) {
    case "instagram":
      return (
        <svg {...f}>
          <path d="M7.5 2h9A5.5 5.5 0 0122 7.5v9a5.5 5.5 0 01-5.5 5.5h-9A5.5 5.5 0 012 16.5v-9A5.5 5.5 0 017.5 2zm0 1.8A3.7 3.7 0 003.8 7.5v9a3.7 3.7 0 003.7 3.7h9a3.7 3.7 0 003.7-3.7v-9a3.7 3.7 0 00-3.7-3.7zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.8a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zM17.3 5.6a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...f}>
          <path d="M13.5 22v-8.2h2.8l.5-3.3h-3.3V8.4c0-1 .4-1.7 1.8-1.7H17V3.8c-.3 0-1.3-.2-2.5-.2-2.5 0-4.1 1.5-4.1 4.2v2.7H7.6v3.3h2.8V22z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...f}>
          <path d="M16.6 2h-3.2v13.2a2.8 2.8 0 11-2.8-2.8c.3 0 .6 0 .8.1V9.2a6 6 0 105.2 5.9V8.6a7.4 7.4 0 004.3 1.4V6.8a4.3 4.3 0 01-4.3-4.8z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...f}>
          <path d="M21.6 7.2a2.5 2.5 0 00-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 00-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 001.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 001.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z" />
        </svg>
      );
    default:
      return null;
  }
}
