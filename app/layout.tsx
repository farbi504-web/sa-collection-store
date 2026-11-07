import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Great_Vibes, Jost, Tajawal } from "next/font/google";
import { CartProvider } from "@/components/Cart";
import "./globals.css";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--f-serif", display: "swap" });
const script = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--f-script", display: "swap" });
const sans = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--f-sans", display: "swap" });
const arabic = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"], variable: "--f-ar", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SA Collection", template: "%s | SA Collection" },
  description: "Mode féminine élégante en Algérie. Livraison partout en Algérie.",
  robots: { index: true, follow: true }
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${serif.variable} ${script.variable} ${sans.variable} ${arabic.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
