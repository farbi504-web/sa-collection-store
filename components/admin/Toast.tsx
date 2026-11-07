export default function Toast({ ok, err }: { ok?: string; err?: string }) {
  if (err)
    return (
      <p className="toast bad" role="alert">
        {err}
      </p>
    );
  if (ok) return <p className="toast">{ok}</p>;
  return null;
}
