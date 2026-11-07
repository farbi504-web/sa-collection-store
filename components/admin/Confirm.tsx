"use client";

import type { ReactNode } from "react";

// Submit button that asks for confirmation before a destructive action
export default function Confirm({ message, className = "btn small danger", children }: { message: string; className?: string; children: ReactNode }) {
  return (
    <button className={className} onClick={(e) => !window.confirm(message) && e.preventDefault()}>
      {children}
    </button>
  );
}

export function PrintButton({ label = "طباعة" }: { label?: string }) {
  return (
    <button type="button" className="btn small ghost no-print" onClick={() => window.print()}>
      {label}
    </button>
  );
}
