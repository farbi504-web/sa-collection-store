"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { checkCredentials, createSession, destroySession, loginAllowed, loginFailed, loginOk, requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { NEXT_STATUS, slugify, STATUS_LABEL } from "@/lib/format";
import { discardDraft, publishDraft, restoreVersionToDraft, saveDraft, saveStore } from "@/lib/content";
import { WILAYAS } from "@/lib/wilayas";

const txt = (f: FormData, k: string, max = 300) => String(f.get(k) ?? "").trim().slice(0, max);
const int = (f: FormData, k: string, d = 0) => {
  const n = Math.floor(Number(f.get(k)));
  return Number.isFinite(n) ? n : d;
};
const chk = (f: FormData, k: string) => f.get(k) === "on";
const safeUrl = (v: unknown) => {
  const t = typeof v === "string" ? v.trim().slice(0, 1000) : "";
  return /^https:\/\//i.test(t) || (/^\/[^/]/.test(t) && !t.includes("..")) ? t : "";
};

function back(path: string, msg: string, bad = false): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${bad ? "err" : "ok"}=${encodeURIComponent(msg)}`);
}

// ---------------- session ----------------
export async function loginAction(f: FormData) {
  const ip = (headers().get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (!loginAllowed(ip)) redirect("/admin/login?err=" + encodeURIComponent("محاولات كثيرة. حاول بعد 15 دقيقة."));
  const email = txt(f, "email", 120);
  const pass = String(f.get("password") ?? "").slice(0, 200);
  if (!(process.env.AUTH_SECRET || "").length || (process.env.AUTH_SECRET || "").length < 16) redirect("/admin/login?err=" + encodeURIComponent("AUTH_SECRET غير مضبوط في الإعدادات."));
  if (!checkCredentials(email, pass)) {
    loginFailed(ip);
    redirect("/admin/login?err=" + encodeURIComponent("البريد أو كلمة السر غير صحيحة."));
  }
  loginOk(ip);
  await createSession(email);
  await audit(email, "login", "session");
  redirect("/admin");
}

export async function logoutAction() {
  destroySession();
  redirect("/admin/login");
}

// ---------------- categories ----------------
export async function saveCategory(f: FormData) {
  const me = await requireAdmin();
  const id = txt(f, "id", 40);
  const name = txt(f, "name", 60);
  if (!name) back("/admin/categories", "اكتب اسم القسم.", true);
  let slug = slugify(txt(f, "slug", 60) || name) || "categorie";
  const data = { name, image: safeUrl(txt(f, "image", 1000)), sortOrder: int(f, "sortOrder"), visible: chk(f, "visible") };
  try {
    if (id) {
      await prisma.category.update({ where: { id }, data });
    } else {
      for (let i = 2; await prisma.category.findUnique({ where: { slug } }); i++) slug = slugify(name) + "-" + i;
      await prisma.category.create({ data: { ...data, slug } });
    }
  } catch {
    back("/admin/categories", "تعذر الحفظ (قد يكون الاسم مكرراً).", true);
  }
  await audit(me.email, id ? "update" : "create", "category", id || null, name);
  back("/admin/categories", "تم الحفظ.");
}

export async function deleteCategory(f: FormData) {
  const me = await requireAdmin();
  const id = txt(f, "id", 40);
  await prisma.category.delete({ where: { id } }).catch(() => null);
  await audit(me.email, "delete", "category", id);
  back("/admin/categories", "تم حذف القسم (المنتجات بقيت بدون قسم).");
}

// ---------------- products ----------------
type VIn = { id?: string; size?: string; color?: string; sku?: string; stock?: number };

export async function saveProduct(f: FormData) {
  const me = await requireAdmin();
  const id = txt(f, "id", 40);
  const name = txt(f, "name", 120);
  const price = int(f, "price", -1);
  const cmp = txt(f, "comparePrice", 12);
  const status = (["DRAFT", "ACTIVE", "ARCHIVED"] as const).find((s) => s === f.get("status")) ?? "DRAFT";
  const here = id ? `/admin/products/${id}` : "/admin/products/new";
  if (!name) back(here, "اكتب اسم المنتج.", true);
  if (price < 0) back(here, "السعر غير صحيح.", true);
  const comparePrice = cmp ? Math.floor(Number(cmp)) : null;
  if (comparePrice !== null && (!Number.isFinite(comparePrice) || comparePrice < 0)) back(here, "السعر القديم غير صحيح.", true);

  let images: string[] = [];
  let variants: VIn[] = [];
  try {
    const im = JSON.parse(String(f.get("images") ?? "[]"));
    images = (Array.isArray(im) ? im : []).map(safeUrl).filter(Boolean).slice(0, 10);
    const va = JSON.parse(String(f.get("variants") ?? "[]"));
    variants = Array.isArray(va) ? va : [];
  } catch {
    back(here, "بيانات غير صالحة.", true);
  }
  const seen = new Set<string>();
  const vs = variants.slice(0, 80).map((v) => ({
    id: typeof v.id === "string" && v.id ? v.id : undefined,
    size: String(v.size ?? "").trim().slice(0, 20),
    color: String(v.color ?? "").trim().slice(0, 30),
    sku: String(v.sku ?? "").trim().slice(0, 40),
    stock: Math.max(0, Math.min(100000, Math.floor(Number(v.stock) || 0)))
  }));
  for (const v of vs) {
    const k = v.size + "|" + v.color;
    if (seen.has(k)) back(here, "يوجد متغيران بنفس المقاس واللون.", true);
    seen.add(k);
  }
  if (status === "ACTIVE" && vs.length === 0) back(here, "أضف متغيراً واحداً على الأقل (يمكن ترك المقاس واللون فارغين) قبل التفعيل.", true);
  if (status === "ACTIVE" && images.length === 0) back(here, "أضف صورة واحدة على الأقل قبل التفعيل.", true);

  const categoryId = txt(f, "categoryId", 40) || null;
  const base = {
    name,
    shortDesc: txt(f, "shortDesc", 200),
    description: txt(f, "description", 4000),
    price,
    comparePrice,
    images,
    status,
    featured: chk(f, "featured"),
    isNew: chk(f, "isNew"),
    bestSeller: chk(f, "bestSeller"),
    sortOrder: int(f, "sortOrder"),
    seoTitle: txt(f, "seoTitle", 120),
    seoDesc: txt(f, "seoDesc", 200),
    categoryId
  };

  let pid = id;
  try {
    await prisma.$transaction(async (tx) => {
      let slug = slugify(txt(f, "slug", 80) || name) || "produit";
      for (let i = 2; ; i++) {
        const c = await tx.product.findUnique({ where: { slug } });
        if (!c || c.id === id) break;
        slug = slugify(txt(f, "slug", 80) || name) + "-" + i;
      }
      const p = id ? await tx.product.update({ where: { id }, data: { ...base, slug } }) : await tx.product.create({ data: { ...base, slug } });
      pid = p.id;
      const existing = await tx.variant.findMany({ where: { productId: p.id } });
      const keep = new Set(vs.map((v) => v.id).filter(Boolean) as string[]);
      const drop = existing.filter((e) => !keep.has(e.id)).map((e) => e.id);
      if (drop.length) await tx.variant.deleteMany({ where: { id: { in: drop } } });
      for (const v of vs) {
        const old = v.id ? existing.find((e) => e.id === v.id) : undefined;
        if (old) {
          await tx.variant.update({ where: { id: old.id }, data: { size: v.size, color: v.color, sku: v.sku, stock: v.stock } });
          if (old.stock !== v.stock) await tx.stockMovement.create({ data: { variantId: old.id, before: old.stock, after: v.stock, reason: "تعديل من صفحة المنتج", actor: me.email } });
        } else {
          const nv = await tx.variant.create({ data: { productId: p.id, size: v.size, color: v.color, sku: v.sku, stock: v.stock } });
          if (v.stock > 0) await tx.stockMovement.create({ data: { variantId: nv.id, before: 0, after: v.stock, reason: "مخزون أولي", actor: me.email } });
        }
      }
    });
  } catch (e) {
    const dup = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
    back(here, dup ? "تعارض في المقاس/اللون، عدّل التسميات ثم احفظ." : "تعذر حفظ المنتج.", true);
  }
  await audit(me.email, id ? "update" : "create", "product", pid, name);
  revalidatePath("/");
  back(`/admin/products/${pid}`, "تم حفظ المنتج.");
}

export async function duplicateProduct(f: FormData) {
  const me = await requireAdmin();
  const p = await prisma.product.findUnique({ where: { id: txt(f, "id", 40) }, include: { variants: true } });
  if (!p) back("/admin/products", "المنتج غير موجود.", true);
  let slug = p.slug + "-copie";
  for (let i = 2; await prisma.product.findUnique({ where: { slug } }); i++) slug = p.slug + "-copie-" + i;
  const copy = await prisma.product.create({
    data: {
      slug,
      name: p.name + " (نسخة)",
      shortDesc: p.shortDesc,
      description: p.description,
      price: p.price,
      comparePrice: p.comparePrice,
      images: p.images,
      status: "DRAFT",
      categoryId: p.categoryId,
      variants: { create: p.variants.map((v) => ({ size: v.size, color: v.color, sku: "", stock: 0 })) }
    }
  });
  await audit(me.email, "duplicate", "product", copy.id, p.name);
  back(`/admin/products/${copy.id}`, "تم النسخ كمسودة، مخزون المتغيرات 0.");
}

export async function setProductStatus(f: FormData) {
  const me = await requireAdmin();
  const id = txt(f, "id", 40);
  const status = (["DRAFT", "ACTIVE", "ARCHIVED"] as const).find((s) => s === f.get("status"));
  if (!status) back("/admin/products", "حالة غير صالحة.", true);
  if (status === "ACTIVE") {
    const p = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
    if (!p || p.variants.length === 0 || p.images.length === 0) back("/admin/products", "لا يمكن تفعيل منتج بدون صورة ومتغير.", true);
  }
  await prisma.product.update({ where: { id }, data: { status } });
  await audit(me.email, "status:" + status, "product", id);
  revalidatePath("/");
  back("/admin/products", "تم التحديث.");
}

export async function deleteProduct(f: FormData) {
  const me = await requireAdmin();
  const id = txt(f, "id", 40);
  const p = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  await prisma.product.delete({ where: { id } }).catch(() => null);
  await audit(me.email, "delete", "product", id, p?.name ?? "");
  revalidatePath("/");
  back("/admin/products", "تم حذف المنتج (الطلبات السابقة تحتفظ باسمه وسعره).");
}

// ---------------- inventory ----------------
export async function adjustStock(f: FormData) {
  const me = await requireAdmin();
  const variantId = txt(f, "variantId", 40);
  const next = int(f, "stock", -1);
  const reason = txt(f, "reason", 120);
  if (next < 0 || next > 100000) back("/admin/inventory", "الكمية غير صحيحة.", true);
  if (!reason) back("/admin/inventory", "اكتب سبب التعديل.", true);
  await prisma.$transaction(async (tx) => {
    const v = await tx.variant.findUnique({ where: { id: variantId } });
    if (!v) throw new Error("NF");
    if (v.stock === next) return;
    await tx.variant.update({ where: { id: v.id }, data: { stock: next } });
    await tx.stockMovement.create({ data: { variantId: v.id, before: v.stock, after: next, reason, actor: me.email } });
  }).catch(() => back("/admin/inventory", "تعذر التعديل.", true));
  back("/admin/inventory", "تم تعديل المخزون وتسجيله.");
}

// ---------------- orders ----------------
export async function updateOrderStatus(f: FormData) {
  const me = await requireAdmin();
  const id = txt(f, "id", 40);
  const to = txt(f, "to", 20);
  const note = txt(f, "note", 200);
  const here = `/admin/orders/${id}`;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) back("/admin/orders", "الطلب غير موجود.", true);
  if (!(NEXT_STATUS[order.status] ?? []).includes(to)) back(here, "هذا الانتقال غير مسموح.", true);
  const target = to as keyof typeof STATUS_LABEL;
  try {
    await prisma.$transaction(async (tx) => {
      let held = order.stockHeld;
      if (to === "CANCELLED" && held) {
        for (const it of order.items) {
          if (!it.variantId) continue;
          const v = await tx.variant.findUnique({ where: { id: it.variantId } });
          if (!v) continue;
          await tx.variant.update({ where: { id: v.id }, data: { stock: { increment: it.qty } } });
          await tx.stockMovement.create({ data: { variantId: v.id, before: v.stock, after: v.stock + it.qty, reason: `إلغاء الطلب ${order.ref}`, actor: me.email } });
        }
        held = false;
      }
      if (order.status === "CANCELLED" && to === "NEW" && !held) {
        for (const it of order.items) {
          if (!it.variantId) continue;
          const r = await tx.variant.updateMany({ where: { id: it.variantId, stock: { gte: it.qty } }, data: { stock: { decrement: it.qty } } });
          if (r.count === 0) throw new Error("STOCK");
          const v = await tx.variant.findUnique({ where: { id: it.variantId } });
          await tx.stockMovement.create({ data: { variantId: it.variantId, before: (v?.stock ?? 0) + it.qty, after: v?.stock ?? 0, reason: `إعادة فتح الطلب ${order.ref}`, actor: me.email } });
        }
        held = true;
      }
      await tx.order.update({ where: { id }, data: { status: target as never, stockHeld: held } });
      await tx.orderEvent.create({ data: { orderId: id, from: order.status, to: target as never, note, actor: me.email } });
    });
  } catch (e) {
    back(here, e instanceof Error && e.message === "STOCK" ? "لا يمكن إعادة فتح الطلب: المخزون غير كافٍ." : "تعذر تغيير الحالة.", true);
  }
  await audit(me.email, `status:${order.status}->${to}`, "order", id, order.ref);
  back(here, "تم تغيير الحالة إلى: " + STATUS_LABEL[to]);
}

export async function saveOrderMeta(f: FormData) {
  const me = await requireAdmin();
  const id = txt(f, "id", 40);
  await prisma.order.update({ where: { id }, data: { internalNotes: txt(f, "internalNotes", 1000), trackingCode: txt(f, "trackingCode", 60) } });
  await audit(me.email, "update-meta", "order", id);
  back(`/admin/orders/${id}`, "تم الحفظ.");
}

// ---------------- reviews ----------------
export async function saveReview(f: FormData) {
  const me = await requireAdmin();
  const name = txt(f, "name", 60);
  const text = txt(f, "text", 400);
  if (!name || !text) back("/admin/reviews", "الاسم والنص مطلوبان.", true);
  const stars = Math.max(1, Math.min(5, int(f, "stars", 5)));
  const status = (["PENDING", "APPROVED", "REJECTED"] as const).find((s) => s === f.get("status")) ?? "PENDING";
  const data = { name, text, stars, status, photo: safeUrl(txt(f, "photo", 1000)), verified: chk(f, "verified"), sortOrder: int(f, "sortOrder") };
  const id = txt(f, "id", 40);
  if (id) await prisma.review.update({ where: { id }, data });
  else await prisma.review.create({ data });
  await audit(me.email, id ? "update" : "create", "review", id || null, name);
  back("/admin/reviews", "تم الحفظ.");
}

export async function deleteReview(f: FormData) {
  const me = await requireAdmin();
  const id = txt(f, "id", 40);
  await prisma.review.delete({ where: { id } }).catch(() => null);
  await audit(me.email, "delete", "review", id);
  back("/admin/reviews", "تم الحذف.");
}

// ---------------- pages ----------------
export async function savePage(f: FormData) {
  const me = await requireAdmin();
  const title = txt(f, "title", 100);
  if (!title) back("/admin/pages", "اكتب عنوان الصفحة.", true);
  const id = txt(f, "id", 40);
  const data = { title, content: txt(f, "content", 20000), published: chk(f, "published"), seoDesc: txt(f, "seoDesc", 200) };
  try {
    if (id) await prisma.page.update({ where: { id }, data });
    else {
      let slug = slugify(txt(f, "slug", 60) || title) || "page";
      for (let i = 2; await prisma.page.findUnique({ where: { slug } }); i++) slug = slugify(title) + "-" + i;
      await prisma.page.create({ data: { ...data, slug } });
    }
  } catch {
    back("/admin/pages", "تعذر الحفظ.", true);
  }
  await audit(me.email, id ? "update" : "create", "page", id || null, title);
  back("/admin/pages", "تم الحفظ. رابط الصفحة: /p/اسم-الصفحة");
}

export async function deletePage(f: FormData) {
  const me = await requireAdmin();
  const id = txt(f, "id", 40);
  await prisma.page.delete({ where: { id } }).catch(() => null);
  await audit(me.email, "delete", "page", id);
  back("/admin/pages", "تم الحذف.");
}

// ---------------- shipping + store settings ----------------
export async function saveShipping(f: FormData) {
  const me = await requireAdmin();
  const all = txt(f, "applyAll", 8);
  const ops = WILAYAS.map((name, i) => {
    const code = i + 1;
    const raw = txt(f, "fee_" + code, 8) || all;
    const fee = raw === "" ? null : Math.max(0, Math.min(100000, Math.floor(Number(raw))));
    return prisma.wilayaFee.upsert({ where: { code }, create: { code, name, fee: Number.isFinite(fee as number) ? fee : null }, update: { fee: Number.isFinite(fee as number) ? fee : null } });
  });
  await prisma.$transaction(ops);
  await saveStore({ name: txt(f, "name", 60), whatsapp: txt(f, "whatsapp", 20), freeShippingFrom: int(f, "freeShippingFrom"), lowStock: int(f, "lowStock", 3) });
  await audit(me.email, "update", "shipping+store");
  back("/admin/shipping", "تم حفظ أسعار التوصيل والإعدادات.");
}

// ---------------- website editor (draft / publish / rollback) ----------------
export async function saveSiteDraftAction(json: string): Promise<{ ok: boolean; error?: string }> {
  const me = await requireAdmin();
  try {
    await saveDraft(JSON.parse(json));
    await audit(me.email, "save-draft", "site");
    return { ok: true };
  } catch {
    return { ok: false, error: "تعذر حفظ المسودة." };
  }
}

export async function publishSiteAction(json: string, note: string): Promise<{ ok: boolean; error?: string }> {
  const me = await requireAdmin();
  try {
    await saveDraft(JSON.parse(json));
    await publishDraft(note);
    await audit(me.email, "publish", "site", null, note);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "تعذر النشر." };
  }
}

export async function discardSiteDraftAction(): Promise<{ ok: boolean }> {
  const me = await requireAdmin();
  await discardDraft();
  await audit(me.email, "discard-draft", "site");
  return { ok: true };
}

export async function restoreVersionAction(f: FormData) {
  const me = await requireAdmin();
  const id = txt(f, "id", 40);
  try {
    await restoreVersionToDraft(id);
  } catch {
    back("/admin/site", "النسخة غير موجودة.", true);
  }
  await audit(me.email, "restore-to-draft", "site", id);
  back("/admin/site", "تم تحميل النسخة كمسودة. راجعها ثم انشرها.");
}
