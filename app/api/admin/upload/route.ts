import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX = 4 * 1024 * 1024;

// Admin-only. Validates type and size; files get a random suffix so names never collide.
export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Stockage d'images non activé : BLOB_READ_WRITE_TOKEN manquant." }, { status: 500 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Format refusé (JPG, PNG, WEBP ou AVIF uniquement)." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Image trop lourde (4 Mo maximum)." }, { status: 400 });
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60) || "image";
  const blob = await put("sa/" + safe, file, { access: "public", addRandomSuffix: true, contentType: file.type });
  return NextResponse.json({ url: blob.url });
}
