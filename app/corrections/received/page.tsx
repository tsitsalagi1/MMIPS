import Link from "next/link";

export default function CorrectionReceivedPage() {
  return (
    <main className="container section">
      <div className="card success-card">
        <p className="eyebrow">Request received</p>
        <h1>Thank you. Your correction/removal request was sent for review.</h1>
        <p className="lead">Nothing changes automatically. MMIPS reviews correction and removal requests before changing public profiles.</p>
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
