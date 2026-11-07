import { getSite } from "@/lib/content";
import Shell from "@/components/Shell";
import CheckoutForm from "./CheckoutForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commander" };

export default async function Checkout() {
  const { site } = await getSite(false);
  return (
    <Shell site={site}>
      <div className="container">
        <div className="page-head">
          <h1>Commander</h1>
        </div>
        <CheckoutForm />
      </div>
    </Shell>
  );
}
