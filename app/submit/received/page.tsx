import Link from "next/link";

export default async function SubmissionReceivedPage({
  searchParams
}: {
  searchParams?: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const demoMode = params?.mode === "demo";

  return (
    <main className="container section">
      <div className="card success-card">
        <p className="eyebrow">Submission received</p>
        <h1>Thank you. This information was sent for review.</h1>
        <p className="lead">
          Nothing has been published. MMIPS reviews submissions before anything becomes public.
        </p>
        {demoMode ? (
          <p className="notice warning">
            Demo mode is active. Supabase environment variables are missing, so this submission was not stored in the database.
          </p>
        ) : null}
        <div className="notice">
          <strong>Important:</strong> MMIPS is not law enforcement. If someone is in immediate danger, call 911. This submission does not replace a police report, NamUs entry, tribal police contact, BIA MMU, FBI, or local law enforcement.
        </div>
        <div className="actions">
          <Link className="button" href="/submit">Submit another profile</Link>
          <Link className="button secondary" href="/">Return home</Link>
        </div>
      </div>
    </main>
  );
}
