import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty" style={{ minHeight: "60vh", alignContent: "center" }}>
      <h1>Page introuvable</h1>
      <p className="muted">Le lien est incorrect ou la page n&apos;existe plus.</p>
      <Link href="/" className="btn">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
