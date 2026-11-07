"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Site, IconName, Platform, SectionId } from "@/lib/content";
import UploadButton from "@/components/admin/Upload";
import { saveSiteDraftAction, publishSiteAction, discardSiteDraftAction } from "../actions";

const ICONS: IconName[] = ["truck", "gem", "headset", "shield", "heart", "none"];
const PLATFORMS: Platform[] = ["instagram", "tiktok", "facebook", "youtube"];
const SECTION_LABEL: Record<SectionId, string> = { collection: "New Collection (الشبكات)", favorites: "Our Favorites (المنتجات المميزة)", reviews: "آراء الزبائن", community: "Join Our Community" };

function T({ label, value, onChange, max = 200, ltr = false }: { label: string; value: string; onChange: (v: string) => void; max?: number; ltr?: boolean }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value} maxLength={max} dir={ltr ? "ltr" : undefined} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function N({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
function C({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="chk">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /> {label}
    </label>
  );
}
function Img({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="toolbar" style={{ margin: 0 }}>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="رابط الصورة أو ارفع صورة" dir="ltr" />
        <UploadButton onUrl={onChange} />
        {value ? <button type="button" className="btn small ghost" onClick={() => onChange("")}>إزالة</button> : null}
      </div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" style={{ height: 70, width: "auto", objectFit: "contain", background: "#eee", borderRadius: 6, marginTop: 6 }} />
      ) : null}
    </div>
  );
}
function Sel<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Item({ children, onUp, onDown, onRemove }: { children: ReactNode; onUp?: () => void; onDown?: () => void; onRemove?: () => void }) {
  return (
    <div className="card-item">
      {children}
      <div className="adm-actions" style={{ margin: 0 }}>
        {onUp ? <button type="button" className="btn small ghost" onClick={onUp}>↑ أعلى</button> : null}
        {onDown ? <button type="button" className="btn small ghost" onClick={onDown}>↓ أسفل</button> : null}
        {onRemove ? <button type="button" className="btn small danger" onClick={onRemove}>حذف</button> : null}
      </div>
    </div>
  );
}
function move<T>(arr: T[], i: number, d: number) {
  const j = i + d;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

const TABS = ["الإعلانات والهيدر", "البانر", "الأقسام والترتيب", "New Collection", "رضا الزبائن", "المجتمع", "الفوتر", "الألوان", "الزخرفة"] as const;

export default function SiteEditor({ initial, hasDraft }: { initial: Site; hasDraft: boolean }) {
  const [site, setSite] = useState<Site>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [draftExists, setDraftExists] = useState(hasDraft);
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [nonce, setNonce] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [note, setNote] = useState("");

  const dirty = useMemo(() => JSON.stringify(site) !== saved, [site, saved]);
  const up = (fn: (d: Site) => void) =>
    setSite((s) => {
      const c = structuredClone(s);
      fn(c);
      return c;
    });

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await saveSiteDraftAction(JSON.stringify(site));
    setBusy(false);
    if (r.ok) {
      setSaved(JSON.stringify(site));
      setDraftExists(true);
      setNonce((n) => n + 1);
      setMsg({ ok: true, text: "تم حفظ المسودة. الزوار لا يرونها بعد." });
    } else setMsg({ ok: false, text: r.error || "تعذر الحفظ" });
  }
  async function publish() {
    if (!window.confirm("نشر التغييرات للزوار الآن؟")) return;
    setBusy(true);
    setMsg(null);
    const r = await publishSiteAction(JSON.stringify(site), note);
    setBusy(false);
    if (r.ok) {
      setSaved(JSON.stringify(site));
      setDraftExists(false);
      setNote("");
      setNonce((n) => n + 1);
      setMsg({ ok: true, text: "تم النشر. الموقع محدَّث الآن." });
    } else setMsg({ ok: false, text: r.error || "تعذر النشر" });
  }
  async function discard() {
    if (!window.confirm("حذف المسودة والعودة للنسخة المنشورة؟")) return;
    setBusy(true);
    await discardSiteDraftAction();
    window.location.href = "/admin/site?ok=" + encodeURIComponent("تم حذف المسودة.");
  }

  const width = device === "mobile" ? 390 : device === "tablet" ? 768 : 1280;

  return (
    <div className="editor">
      <div>
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="panel">
          {tab === "الإعلانات والهيدر" ? (
            <>
              <h2>شريط الإعلانات</h2>
              <C label="إظهار الشريط" value={site.announcement.visible} onChange={(v) => up((d) => (d.announcement.visible = v))} />
              {site.announcement.items.map((it, i) => (
                <Item key={i} onUp={() => up((d) => move(d.announcement.items, i, -1))} onDown={() => up((d) => move(d.announcement.items, i, 1))} onRemove={() => up((d) => d.announcement.items.splice(i, 1))}>
                  <T label="النص" value={it.text} onChange={(v) => up((d) => (d.announcement.items[i].text = v))} max={80} />
                  <Sel label="الأيقونة" value={it.icon} options={ICONS} onChange={(v) => up((d) => (d.announcement.items[i].icon = v))} />
                </Item>
              ))}
              <button type="button" className="btn small ghost" onClick={() => up((d) => d.announcement.items.push({ text: "", icon: "none" }))}>+ رسالة</button>
              <T label="النص بالخط اليدوي (يمين الشريط)" value={site.announcement.script} onChange={(v) => up((d) => (d.announcement.script = v))} max={80} />

              <h2 style={{ marginTop: 18 }}>الهيدر</h2>
              <Img label="الشعار" value={site.header.logo} onChange={(v) => up((d) => (d.header.logo = v))} />
              <N label="ارتفاع الشعار (px)" value={site.header.logoHeight} min={20} max={90} onChange={(v) => up((d) => (d.header.logoHeight = v))} />
              <C label="تثبيت الهيدر عند التمرير" value={site.header.sticky} onChange={(v) => up((d) => (d.header.sticky = v))} />
              <C label="إظهار البحث" value={site.header.showSearch} onChange={(v) => up((d) => (d.header.showSearch = v))} />
              <C label="إظهار السلة" value={site.header.showCart} onChange={(v) => up((d) => (d.header.showCart = v))} />
              <p className="muted small">روابط القائمة (زر ☰):</p>
              {site.header.links.map((l, i) => (
                <Item key={i} onUp={() => up((d) => move(d.header.links, i, -1))} onDown={() => up((d) => move(d.header.links, i, 1))} onRemove={() => up((d) => d.header.links.splice(i, 1))}>
                  <T label="الاسم" value={l.label} onChange={(v) => up((d) => (d.header.links[i].label = v))} max={40} />
                  <T label="الرابط (/shop أو https://...)" value={l.url} onChange={(v) => up((d) => (d.header.links[i].url = v))} ltr />
                </Item>
              ))}
              <button type="button" className="btn small ghost" onClick={() => up((d) => d.header.links.push({ label: "", url: "/" }))}>+ رابط</button>
            </>
          ) : null}

          {tab === "البانر" ? (
            <>
              <h2>البانر الرئيسي</h2>
              <C label="إظهار البانر" value={site.hero.visible} onChange={(v) => up((d) => (d.hero.visible = v))} />
              <C label="تغيير تلقائي بين الشرائح" value={site.hero.autoplay} onChange={(v) => up((d) => (d.hero.autoplay = v))} />
              <N label="مدة كل شريحة (ثوانٍ)" value={site.hero.seconds} min={2} max={30} onChange={(v) => up((d) => (d.hero.seconds = v))} />
              {site.hero.slides.map((s, i) => (
                <Item key={i} onUp={() => up((d) => move(d.hero.slides, i, -1))} onDown={() => up((d) => move(d.hero.slides, i, 1))} onRemove={() => up((d) => d.hero.slides.splice(i, 1))}>
                  <Img label="صورة الحاسوب" value={s.desktop} onChange={(v) => up((d) => (d.hero.slides[i].desktop = v))} />
                  <Img label="صورة الهاتف" value={s.mobile} onChange={(v) => up((d) => (d.hero.slides[i].mobile = v))} />
                  <T label="النص اليدوي (Welcome to)" value={s.script} onChange={(v) => up((d) => (d.hero.slides[i].script = v))} max={60} />
                  <T label="العنوان" value={s.title} onChange={(v) => up((d) => (d.hero.slides[i].title = v))} max={80} />
                  <T label="العنوان الفرعي" value={s.subtitle} onChange={(v) => up((d) => (d.hero.slides[i].subtitle = v))} max={160} />
                  <T label="نص الزر" value={s.ctaText} onChange={(v) => up((d) => (d.hero.slides[i].ctaText = v))} max={40} />
                  <T label="رابط الزر" value={s.ctaUrl} onChange={(v) => up((d) => (d.hero.slides[i].ctaUrl = v))} ltr />
                  <Sel label="مكان النص" value={s.side} options={["right", "left"]} onChange={(v) => up((d) => (d.hero.slides[i].side = v))} />
                </Item>
              ))}
              <button type="button" className="btn small ghost" onClick={() => up((d) => d.hero.slides.length < 8 && d.hero.slides.push({ desktop: "", mobile: "", script: "", title: "", subtitle: "", ctaText: "Shop Now", ctaUrl: "/shop", side: "right" }))}>+ شريحة</button>
            </>
          ) : null}

          {tab === "الأقسام والترتيب" ? (
            <>
              <h2>ترتيب وإظهار أقسام الصفحة الرئيسية</h2>
              {site.sections.map((s, i) => (
                <Item key={s.id} onUp={() => up((d) => move(d.sections, i, -1))} onDown={() => up((d) => move(d.sections, i, 1))}>
                  <C label={SECTION_LABEL[s.id]} value={s.visible} onChange={(v) => up((d) => (d.sections[i].visible = v))} />
                </Item>
              ))}
              <p className="muted small">القسم الفارغ (بدون منتجات مميزة أو آراء منشورة أو روابط) يختفي تلقائياً.</p>
              <h2 style={{ marginTop: 14 }}>العناوين</h2>
              <T label="عنوان New Collection" value={site.collection.heading} onChange={(v) => up((d) => (d.collection.heading = v))} max={60} />
              <T label="عنوان Our Favorites" value={site.favorites.heading} onChange={(v) => up((d) => (d.favorites.heading = v))} max={60} />
              <N label="عدد المنتجات المميزة" value={site.favorites.count} min={1} max={12} onChange={(v) => up((d) => (d.favorites.count = v))} />
              <N label="الأعمدة على الحاسوب" value={site.favorites.columns} min={2} max={5} onChange={(v) => up((d) => (d.favorites.columns = v))} />
              <T label="عنوان الآراء" value={site.reviews.heading} onChange={(v) => up((d) => (d.reviews.heading = v))} max={60} />
              <T label="عنوان المجتمع" value={site.community.heading} onChange={(v) => up((d) => (d.community.heading = v))} max={60} />
            </>
          ) : null}

          {tab === "New Collection" ? (
            <>
              <h2>بطاقات الشبكات</h2>
              <p className="muted small">البطاقة بدون رابط لا تظهر.</p>
              {site.collection.cards.map((c, i) => (
                <Item key={i} onUp={() => up((d) => move(d.collection.cards, i, -1))} onDown={() => up((d) => move(d.collection.cards, i, 1))} onRemove={() => up((d) => d.collection.cards.splice(i, 1))}>
                  <Sel label="المنصة (تحدد الأيقونة)" value={c.platform} options={PLATFORMS} onChange={(v) => up((d) => (d.collection.cards[i].platform = v))} />
                  <T label="العنوان" value={c.title} onChange={(v) => up((d) => (d.collection.cards[i].title = v))} max={40} />
                  <T label="نص الزر" value={c.button} onChange={(v) => up((d) => (d.collection.cards[i].button = v))} max={30} />
                  <T label="الرابط" value={c.url} onChange={(v) => up((d) => (d.collection.cards[i].url = v))} ltr />
                  <Img label="صورة الخلفية" value={c.image} onChange={(v) => up((d) => (d.collection.cards[i].image = v))} />
                  <C label="ظاهرة" value={c.visible} onChange={(v) => up((d) => (d.collection.cards[i].visible = v))} />
                </Item>
              ))}
              <button type="button" className="btn small ghost" onClick={() => up((d) => d.collection.cards.length < 6 && d.collection.cards.push({ platform: "instagram", title: "", button: "Découvrir", url: "", image: "", visible: true }))}>+ بطاقة</button>
            </>
          ) : null}

          {tab === "رضا الزبائن" ? (
            <>
              <h2>لافتة نسبة الرضا</h2>
              <p className="notice" style={{ background: "#fff8e1" }}>لا تفعّل اللافتة ولا تكتب نسبة إلا إذا كانت مبنية على بيانات حقيقية عندك (استبيان، تقييمات موثقة). الموقع لا يعرض أي رقم افتراضي.</p>
              <C label="إظهار اللافتة" value={site.satisfaction.show} onChange={(v) => up((d) => (d.satisfaction.show = v))} />
              <T label="النسبة (رقم فقط)" value={site.satisfaction.percent} onChange={(v) => up((d) => (d.satisfaction.percent = v.replace(/[^0-9.,]/g, "")))} max={5} ltr />
              <T label="العنوان" value={site.satisfaction.heading} onChange={(v) => up((d) => (d.satisfaction.heading = v))} max={60} />
              <T label="الوصف" value={site.satisfaction.description} onChange={(v) => up((d) => (d.satisfaction.description = v))} max={120} />
              <Img label="صورة الخلفية (اختياري)" value={site.satisfaction.image} onChange={(v) => up((d) => (d.satisfaction.image = v))} />
              <p className="muted small">تظهر بجانب المنتجات المميزة، فلا تظهر إن لم توجد منتجات مميزة.</p>
            </>
          ) : null}

          {tab === "المجتمع" ? (
            <>
              <h2>روابط Join Our Community</h2>
              {site.community.links.map((l, i) => (
                <Item key={i} onUp={() => up((d) => move(d.community.links, i, -1))} onDown={() => up((d) => move(d.community.links, i, 1))} onRemove={() => up((d) => d.community.links.splice(i, 1))}>
                  <Sel label="المنصة" value={l.platform} options={PLATFORMS} onChange={(v) => up((d) => (d.community.links[i].platform = v))} />
                  <T label="النص" value={l.label} onChange={(v) => up((d) => (d.community.links[i].label = v))} max={30} />
                  <T label="الرابط" value={l.url} onChange={(v) => up((d) => (d.community.links[i].url = v))} ltr />
                </Item>
              ))}
              <button type="button" className="btn small ghost" onClick={() => up((d) => d.community.links.length < 6 && d.community.links.push({ platform: "instagram", label: "", url: "" }))}>+ رابط</button>
            </>
          ) : null}

          {tab === "الفوتر" ? (
            <>
              <h2>الفوتر</h2>
              <Img label="الشعار (يُعرض بالأبيض على الأسود تلقائياً)" value={site.footer.logo} onChange={(v) => up((d) => (d.footer.logo = v))} />
              {site.footer.groups.map((g, i) => (
                <Item key={i} onUp={() => up((d) => move(d.footer.groups, i, -1))} onDown={() => up((d) => move(d.footer.groups, i, 1))} onRemove={() => up((d) => d.footer.groups.splice(i, 1))}>
                  <Sel label="الأيقونة" value={g.icon} options={ICONS} onChange={(v) => up((d) => (d.footer.groups[i].icon = v))} />
                  <T label="السطر 1" value={g.line1} onChange={(v) => up((d) => (d.footer.groups[i].line1 = v))} max={40} />
                  <T label="السطر 2" value={g.line2} onChange={(v) => up((d) => (d.footer.groups[i].line2 = v))} max={40} />
                </Item>
              ))}
              <button type="button" className="btn small ghost" onClick={() => up((d) => d.footer.groups.length < 4 && d.footer.groups.push({ icon: "none", line1: "", line2: "" }))}>+ مجموعة</button>
              <T label="رسالة العلامة (خط يدوي)" value={site.footer.message} onChange={(v) => up((d) => (d.footer.message = v))} max={100} />
              <T label="حقوق النشر" value={site.footer.copyright} onChange={(v) => up((d) => (d.footer.copyright = v))} max={120} />
              <p className="muted small">روابط أسفل الفوتر (الخصوصية، الشروط... مثل /p/privacy بعد إنشاء الصفحة):</p>
              {site.footer.links.map((l, i) => (
                <Item key={i} onRemove={() => up((d) => d.footer.links.splice(i, 1))}>
                  <T label="الاسم" value={l.label} onChange={(v) => up((d) => (d.footer.links[i].label = v))} max={40} />
                  <T label="الرابط" value={l.url} onChange={(v) => up((d) => (d.footer.links[i].url = v))} ltr />
                </Item>
              ))}
              <button type="button" className="btn small ghost" onClick={() => up((d) => d.footer.links.length < 8 && d.footer.links.push({ label: "", url: "/p/" }))}>+ رابط</button>
              <p className="muted small" style={{ marginTop: 10 }}>روابط الشبكات (الفارغة لا تظهر):</p>
              {site.footer.socials.map((x, i) => (
                <T key={i} label={x.platform} value={x.url} onChange={(v) => up((d) => (d.footer.socials[i].url = v))} ltr />
              ))}
            </>
          ) : null}

          {tab === "الألوان" ? (
            <>
              <h2>الألوان والشكل</h2>
              {(["ink", "paper", "ivory", "beige", "line"] as const).map((k) => (
                <div className="field" key={k}>
                  <label>{{ ink: "الأسود (النصوص والأزرار)", paper: "الخلفية", ivory: "العاجي", beige: "البيج", line: "الخطوط الفاصلة" }[k]}</label>
                  <div className="row">
                    <input type="color" value={site.theme[k].length === 7 ? site.theme[k] : "#000000"} onChange={(e) => up((d) => (d.theme[k] = e.target.value))} style={{ width: 56, padding: 2 }} />
                    <input value={site.theme[k]} onChange={(e) => up((d) => (d.theme[k] = e.target.value))} dir="ltr" maxLength={9} />
                  </div>
                </div>
              ))}
              <N label="استدارة الزوايا (px)" value={site.theme.radius} min={0} max={24} onChange={(v) => up((d) => (d.theme.radius = v))} />
              <button type="button" className="btn small ghost" onClick={() => up((d) => (d.theme = { ink: "#0a0a0a", paper: "#ffffff", ivory: "#f6f3ee", beige: "#e8dfd3", line: "#dcd6cd", radius: 6 }))}>الألوان الافتراضية</button>
            </>
          ) : null}

          {tab === "الزخرفة" ? (
            <>
              <h2>الزخرفة النباتية (أسفل اليسار)</h2>
              <C label="إظهار الزخرفة" value={site.ornament.show} onChange={(v) => up((d) => (d.ornament.show = v))} />
              <N label="الحجم (px)" value={site.ornament.size} min={60} max={320} onChange={(v) => up((d) => (d.ornament.size = v))} />
              <Img label="صورة زخرفة خاصة بك (اختياري، تحل محل الرسم المدمج)" value={site.ornament.image} onChange={(v) => up((d) => (d.ornament.image = v))} />
            </>
          ) : null}
        </div>

        <div className="panel" style={{ position: "sticky", bottom: 8, boxShadow: "0 4px 18px rgba(0,0,0,.12)" }}>
          {msg ? <p className={msg.ok ? "toast" : "toast bad"} role="status">{msg.text}</p> : null}
          <p className="muted small">{dirty ? "توجد تغييرات غير محفوظة." : draftExists ? "لديك مسودة محفوظة غير منشورة." : "لا توجد تغييرات معلّقة."}</p>
          <div className="field"><label>ملاحظة للنسخة (اختياري)</label><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} /></div>
          <div className="adm-actions">
            <button type="button" className="btn small ghost" disabled={busy || !dirty} onClick={save}>حفظ كمسودة</button>
            <button type="button" className="btn small" disabled={busy || (!dirty && !draftExists)} onClick={publish}>نشر</button>
            {draftExists ? <button type="button" className="btn small danger" disabled={busy} onClick={discard}>حذف المسودة</button> : null}
          </div>
        </div>
      </div>

      <div>
        <div className="preview-bar">
          {(["desktop", "tablet", "mobile"] as const).map((d) => (
            <button key={d} type="button" className={"btn small" + (device === d ? "" : " ghost")} onClick={() => setDevice(d)}>
              {{ desktop: "حاسوب", tablet: "لوحي", mobile: "هاتف" }[d]}
            </button>
          ))}
          <button type="button" className="btn small ghost" onClick={() => setNonce((n) => n + 1)}>تحديث المعاينة</button>
        </div>
        <p className="muted small">المعاينة تعرض آخر مسودة محفوظة (احفظ أولاً لتراها). لا يراها الزوار.</p>
        <div className="preview-frame">
          <iframe title="معاينة الموقع" src={`/?preview=1&t=${nonce}`} style={{ width }} />
        </div>
      </div>
    </div>
  );
}
