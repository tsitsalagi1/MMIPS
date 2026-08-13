import type { Metadata } from "next";
import Link from "next/link";
import { mmipsSiteMode } from "@/lib/site-mode";

export const metadata: Metadata = { robots: { index: false, follow: false, noarchive: true } };

function safeReference(value: string | undefined, canada: boolean) {
  if (!value) return null;
  if (canada) return /^CA-\d{4}-[A-F0-9]{8}$/.test(value) ? value : null;
  return /^MMIPS-[A-F0-9]{16}$/.test(value) ? value : null;
}

export default async function SubmissionReceivedPage({
  searchParams
}: {
  searchParams?: Promise<{ mode?: string; ref?: string; country?: string }>;
}) {
  const params = await searchParams;
  const canada = mmipsSiteMode() === "ca" || params?.country === "ca";
  const demoMode = params?.mode === "demo";
  const reference = safeReference(params?.ref, canada);

  return (
    <main className="container section">
      <div className="card success-card">
        <p className="eyebrow">Submission received</p>
        <h1>Thank you. This information was sent for private review.</h1>
        <p className="lead">Nothing has been published. {canada ? "MMIPS Canada" : "MMIPS"} reviews submissions before anything becomes public.</p>
        {reference ? (
          <div className="notice" role="status">
            <strong>Your {canada ? "MMIPS Canada" : "MMIPS"} reference:</strong> <code>{reference}</code>
            <p>Save this reference with your records. It is a tracking label, not a public profile number and not proof that anything has been published.</p>
          </div>
        ) : null}
        {demoMode ? <p className="notice warning">Demo mode is active. Supabase environment variables are missing, so this submission was not stored in the database.</p> : null}
        <div className="notice">
          <strong>Important:</strong> {canada ? "MMIPS Canada is not police or an emergency service. If someone is in immediate danger, call 911. This submission does not replace a missing-person report to the police service of jurisdiction." : "MMIPS is not law enforcement. If someone is in immediate danger, call 911. This submission does not replace a police report, NamUs entry, tribal police contact, BIA MMU, FBI, or local law enforcement."}
        </div>
        <div className="actions">
          <Link className="button" href="/submit">Submit another item</Link>
          <Link className="button secondary" href="/">Return home</Link>
        </div>
      </div>
    </main>
  );
}
