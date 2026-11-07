"use client";

import { useRef, useState } from "react";

// Uploads one image to /api/admin/upload and returns its URL
export default function UploadButton({ onUrl, label = "رفع صورة" }: { onUrl: (url: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    setErr("");
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setErr(data.error || "فشل الرفع");
          break;
        }
        onUrl(data.url);
      } catch {
        setErr("فشل الرفع. تحقق من الاتصال.");
        break;
      }
    }
    setBusy(false);
  }

  return (
    <span>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={pick} />
      <button type="button" className="btn small ghost" disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? "جارٍ الرفع…" : label}
      </button>
      {err ? <span className="err" role="alert"> {err}</span> : null}
    </span>
  );
}
