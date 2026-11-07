"use client";

import { useState } from "react";
import UploadButton from "@/components/admin/Upload";
import { saveProduct } from "../../actions";

type V = { id?: string; size: string; color: string; sku: string; stock: number };
type P = {
  id: string; name: string; slug: string; categoryId: string; price: number; comparePrice: number | null; shortDesc: string; description: string;
  status: string; featured: boolean; isNew: boolean; bestSeller: boolean; sortOrder: number; seoTitle: string; seoDesc: string; images: string[]; variants: V[];
};

export default function ProductForm({ product, categories }: { product: P | null; categories: { id: string; name: string }[] }) {
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [variants, setVariants] = useState<V[]>(product?.variants ?? []);
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");

  const setV = (i: number, patch: Partial<V>) => setVariants((cur) => cur.map((v, k) => (k === i ? { ...v, ...patch } : v)));

  // builds every size x color combination that does not exist yet
  function generate() {
    const S = sizes.split(",").map((x) => x.trim()).filter(Boolean);
    const C = colors.split(",").map((x) => x.trim()).filter(Boolean);
    const ss = S.length ? S : [""];
    const cc = C.length ? C : [""];
    setVariants((cur) => {
      const have = new Set(cur.map((v) => v.size + "|" + v.color));
      const add: V[] = [];
      for (const s of ss) for (const c of cc) if (!have.has(s + "|" + c)) add.push({ size: s, color: c, sku: "", stock: 0 });
      return [...cur, ...add].slice(0, 80);
    });
  }

  return (
    <form action={saveProduct}>
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />

      <div className="adm-grid2">
        <section className="panel">
          <h2>المعلومات</h2>
          <div className="field"><label htmlFor="name">اسم المنتج</label><input id="name" name="name" defaultValue={product?.name} required maxLength={120} /></div>
          <div className="field"><label htmlFor="slug">الرابط (اختياري، يُولَّد من الاسم)</label><input id="slug" name="slug" defaultValue={product?.slug} dir="ltr" /></div>
          <div className="field">
            <label htmlFor="categoryId">القسم</label>
            <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""}>
              <option value="">بدون قسم</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="adm-grid2">
            <div className="field"><label htmlFor="price">السعر (DA)</label><input id="price" name="price" type="number" min={0} defaultValue={product?.price} required /></div>
            <div className="field"><label htmlFor="comparePrice">السعر القديم (اختياري)</label><input id="comparePrice" name="comparePrice" type="number" min={0} defaultValue={product?.comparePrice ?? ""} /></div>
          </div>
          <div className="field"><label htmlFor="shortDesc">وصف قصير</label><input id="shortDesc" name="shortDesc" defaultValue={product?.shortDesc} maxLength={200} /></div>
          <div className="field"><label htmlFor="description">الوصف الكامل</label><textarea id="description" name="description" defaultValue={product?.description} rows={6} /></div>
        </section>

        <section className="panel">
          <h2>الحالة والعرض</h2>
          <div className="field">
            <label htmlFor="status">الحالة</label>
            <select id="status" name="status" defaultValue={product?.status ?? "DRAFT"}>
              <option value="DRAFT">مسودة (غير ظاهر)</option>
              <option value="ACTIVE">مفعّل (ظاهر في المتجر)</option>
              <option value="ARCHIVED">مؤرشف</option>
            </select>
          </div>
          <label className="chk"><input type="checkbox" name="featured" defaultChecked={product?.featured} /> مميّز (يظهر في Our Favorites)</label>
          <label className="chk"><input type="checkbox" name="isNew" defaultChecked={product?.isNew} /> جديد</label>
          <label className="chk"><input type="checkbox" name="bestSeller" defaultChecked={product?.bestSeller} /> الأكثر مبيعاً</label>
          <div className="field"><label htmlFor="sortOrder">الترتيب (الأصغر أولاً)</label><input id="sortOrder" name="sortOrder" type="number" defaultValue={product?.sortOrder ?? 0} /></div>
          <div className="field"><label htmlFor="seoTitle">عنوان SEO</label><input id="seoTitle" name="seoTitle" defaultValue={product?.seoTitle} maxLength={120} /></div>
          <div className="field"><label htmlFor="seoDesc">وصف SEO</label><textarea id="seoDesc" name="seoDesc" defaultValue={product?.seoDesc} rows={2} maxLength={200} /></div>
        </section>
      </div>

      <section className="panel">
        <h2>الصور</h2>
        <div className="imgs">
          {images.map((src, i) => (
            <div className="im" key={src + i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
              <button type="button" aria-label="حذف الصورة" onClick={() => setImages((c) => c.filter((_, k) => k !== i))}>×</button>
              {i > 0 ? (
                <button type="button" style={{ top: 28 }} aria-label="تقديم" title="اجعلها الأولى" onClick={() => setImages((c) => [c[i], ...c.filter((_, k) => k !== i)])}>↑</button>
              ) : null}
            </div>
          ))}
        </div>
        <UploadButton onUrl={(u) => setImages((c) => [...c, u].slice(0, 10))} label="رفع صور (حتى 10)" />
        <p className="muted small">الصورة الأولى هي الرئيسية. الحد 4 ميغابايت للصورة.</p>
      </section>

      <section className="panel">
        <h2>المقاسات والألوان والمخزون</h2>
        <p className="muted small">لكل تركيبة مقاس/لون مخزونها الخاص. اترك المقاس واللون فارغين إن كان المنتج بدون خيارات.</p>
        <div className="toolbar">
          <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="المقاسات: S, M, L" dir="ltr" />
          <input value={colors} onChange={(e) => setColors(e.target.value)} placeholder="الألوان: Noir, Beige" dir="ltr" />
          <button type="button" className="btn small" onClick={generate}>إنشاء التركيبات</button>
          <button type="button" className="btn small ghost" onClick={() => setVariants((c) => [...c, { size: "", color: "", sku: "", stock: 0 }].slice(0, 80))}>إضافة صف</button>
        </div>
        {variants.length === 0 ? (
          <p className="muted">لا توجد متغيرات بعد.</p>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>المقاس</th><th>اللون</th><th>SKU</th><th>المخزون</th><th></th></tr></thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={v.id ?? "n" + i}>
                    <td><input value={v.size} onChange={(e) => setV(i, { size: e.target.value })} maxLength={20} aria-label="المقاس" /></td>
                    <td><input value={v.color} onChange={(e) => setV(i, { color: e.target.value })} maxLength={30} aria-label="اللون" /></td>
                    <td><input value={v.sku} onChange={(e) => setV(i, { sku: e.target.value })} maxLength={40} aria-label="SKU" /></td>
                    <td><input type="number" min={0} value={v.stock} onChange={(e) => setV(i, { stock: Math.max(0, Number(e.target.value) || 0) })} aria-label="المخزون" style={{ width: 90 }} /></td>
                    <td><button type="button" className="btn small ghost" onClick={() => setVariants((c) => c.filter((_, k) => k !== i))}>حذف</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="adm-actions">
        <button className="btn">حفظ المنتج</button>
      </div>
    </form>
  );
}
