import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminNav from "@/components/admin/AdminNav";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "لوحة التحكم", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    return (
      <div className="adm" dir="rtl">
        {children}
      </div>
    );
  }
  const newOrders = await prisma.order.count({ where: { status: "NEW" } }).catch(() => 0);
  return (
    <div className="adm" dir="rtl">
      <div className="adm-shell">
        <nav className="adm-nav" aria-label="القائمة">
          <div className="brand">SA Collection</div>
          <AdminNav
            items={[
              { href: "/admin", label: "نظرة عامة" },
              { href: "/admin/orders", label: "الطلبات", count: newOrders },
              { href: "/admin/products", label: "المنتجات" },
              { href: "/admin/categories", label: "الأقسام" },
              { href: "/admin/inventory", label: "المخزون" },
              { href: "/admin/customers", label: "الزبائن" },
              "sep",
              { href: "/admin/site", label: "تصميم الموقع" },
              { href: "/admin/reviews", label: "آراء الزبائن" },
              { href: "/admin/pages", label: "الصفحات" },
              "sep",
              { href: "/admin/shipping", label: "التوصيل والإعدادات" },
              { href: "/admin/audit", label: "سجل العمليات" }
            ]}
          />
          <div className="sep" />
          <Link href="/" target="_blank">
            عرض المتجر
          </Link>
          <form action={logoutAction}>
            <button className="btn small ghost" style={{ color: "#fff", borderColor: "#fff", marginTop: 8 }}>
              تسجيل الخروج
            </button>
          </form>
        </nav>
        <div className="adm-main">{children}</div>
      </div>
    </div>
  );
}
