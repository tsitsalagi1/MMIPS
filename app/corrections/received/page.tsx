import Link from "next/link";

function safeReference(value: string | undefined) {
  return value && /^MMIPS-C-[A-F0-9]{16}$/.test(value) ? value : null;
}

export default async function CorrectionReceivedPage({
  searchParams
}: {
  searchParams?: Promise<{ mode?: string; ref?: string }>;
}) {
  const params = await searchParams;
  const reference = safeReference(params?.ref);
  const demoMode = params?.mode === "demo";

  return (
    <main className="container section">
      <div className="card success-card">
        <p className="eyebrow">Request received</p>
        <h1>Thank you. Your correction/removal request was sent for review.</h1>
        <p className="lead">Nothing changes automatically. MMIPS reviews correction and removal requests before changing public profiles.</p>
        {reference ? (
          <div className="notice" role="status">
            <strong>Your MMIPS request reference:</strong> <code>{reference}</code>
            <p>Save this tracking reference with your records. It does not reveal the request publicly.</p>
          </div>
        ) : null}
        {demoMode ? <p className="notice warning">Demo mode is active. This request was not stored in the production database.</p> : null}
        <div className="notice">
          <strong>Important:</strong> For emergencies, call 911. For tips or official information, contact the listed agency or official tip line directly. MMIPS is not law enforcement.
        </div>
        <div className="actions">
          <Link className="button" href="/corrections">Send another request</Link>
          <Link className="button secondary" href="/profiles">Return to profiles</Link>
        </div>
      </div>
    </main>
  );
}
