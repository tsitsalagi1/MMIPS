"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type TotpFactor = {
  id: string;
  status: "verified" | "unverified";
  friendly_name?: string;
};

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export default function AdminMfaPanel() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [signedIn, setSignedIn] = useState(false);
  const [verifiedFactor, setVerifiedFactor] = useState<TotpFactor | null>(null);
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);
  const [nextLevel, setNextLevel] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    setSignedIn(Boolean(session));
    if (!session) {
      setVerifiedFactor(null);
      setCurrentLevel(null);
      setNextLevel(null);
      setEnrollment(null);
      return;
    }

    const [{ data: factorsData }, { data: aalData }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    ]);

    const verified = (factorsData?.totp || []).find((factor) => factor.status === "verified") as TotpFactor | undefined;
    setVerifiedFactor(verified || null);
    setCurrentLevel(aalData?.currentLevel || null);
    setNextLevel(aalData?.nextLevel || null);
    if (verified) setEnrollment(null);
  }

  useEffect(() => {
    refresh();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function startEnrollment() {
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "MMIPS Admin" });
      if (error || !data?.id || !data.totp?.qr_code || !data.totp?.secret) throw error || new Error("Authenticator setup could not start.");
      setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
      setCode("");
      setMessage("Scan the QR code with an authenticator app, then enter the six-digit code to finish setup.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authenticator setup could not start.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyFactor(factorId: string) {
    const normalizedCode = code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(normalizedCode)) {
      setMessage("Enter the six-digit code from your authenticator app.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: normalizedCode });
      if (error) throw error;
      setCode("");
      setEnrollment(null);
      await refresh();
      setMessage("Authenticator verification succeeded. This admin session now has MFA protection.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authenticator verification failed. Check the code and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!signedIn) return null;

  const needsChallenge = verifiedFactor && currentLevel !== "aal2" && nextLevel === "aal2";

  return (
    <section className="container section correction-admin-section" aria-labelledby="admin-mfa-heading">
      <div className="card">
        <p className="eyebrow">Admin security</p>
        <h2 id="admin-mfa-heading">Authenticator multi-factor authentication</h2>
        {currentLevel === "aal2" ? (
          <div className="notice" role="status">
            <strong>MFA verified for this admin session.</strong>
            <p>Administrative API requests are protected by the second-factor assurance level for this enrolled account.</p>
          </div>
        ) : needsChallenge ? (
          <div className="notice warning">
            <strong>Authenticator verification required.</strong>
            <p>This admin account has MFA enrolled. Enter the current six-digit code before using protected admin actions.</p>
            <label>Authenticator code
              <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
            </label>
            <button type="button" onClick={() => verifyFactor(verifiedFactor.id)} disabled={busy}>{busy ? "Verifying..." : "Verify authenticator"}</button>
          </div>
        ) : enrollment ? (
          <div className="notice warning">
            <strong>Finish authenticator setup now.</strong>
            <p>Scan this QR code with an authenticator app such as Google Authenticator, Microsoft Authenticator, 1Password, Bitwarden, or another TOTP-compatible app.</p>
            <p><img src={enrollment.qrCode} alt="QR code for enrolling the MMIPS admin authenticator factor" style={{ maxWidth: "240px", background: "white", padding: "8px" }} /></p>
            <details>
              <summary>Can’t scan the QR code?</summary>
              <p>Enter this setup secret manually in your authenticator app. Treat it like a password and do not share or save it in screenshots.</p>
              <code>{enrollment.secret}</code>
            </details>
            <label>Six-digit authenticator code
              <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
            </label>
            <button type="button" onClick={() => verifyFactor(enrollment.factorId)} disabled={busy}>{busy ? "Verifying..." : "Verify and enable MFA"}</button>
          </div>
        ) : (
          <div className="notice warning">
            <strong>Protect this admin account before public launch.</strong>
            <p>Password-only admin access is still available because no authenticator factor is enrolled yet. Enroll TOTP now; once verified, MMIPS will require AAL2 for this account’s admin API requests.</p>
            <button type="button" onClick={startEnrollment} disabled={busy}>{busy ? "Starting..." : "Set up authenticator MFA"}</button>
          </div>
        )}
        {message ? <p role="status" className="small-text">{message}</p> : null}
      </div>
    </section>
  );
}
