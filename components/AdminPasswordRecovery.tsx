"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function AdminPasswordRecovery({ siteLabel }: { siteLabel: string }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initializeRecovery() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          url.searchParams.delete("code");
          window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
        }

        const { data } = await supabase.auth.getSession();
        if (!cancelled && data.session) setRecoveryReady(true);
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "The recovery link could not be verified.");
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setRecoveryReady(true);
        setChecking(false);
      }
    });

    void initializeRecovery();
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function sendRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setBusy(true);
    setMessage("");
    try {
      const redirectTo = `${window.location.origin}/admin/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
      if (error) throw error;
      setMessage(`If that email belongs to an authorized ${siteLabel} admin account, a password-reset message has been sent. Open the newest message and follow its link.`);
    } catch {
      setMessage("The reset request could not be completed right now. Check the email address and try again, or contact the MMIPS system administrator.");
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < 14) {
      setMessage("Use a password with at least 14 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("The two password entries do not match.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      await supabase.auth.signOut();
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated. Returning to admin sign in…");
      window.setTimeout(() => router.push("/admin"), 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The password could not be updated. Request a new reset link and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container section plain-language-page">
      <p className="eyebrow">{siteLabel} administration</p>
      <h1>Reset admin password</h1>
      <p className="lead">Use this page only for an authorized MMIPS administrator account. A reset email does not grant admin access; the email must still be on the server-side admin allowlist and protected actions still require authenticator MFA.</p>

      {checking ? <div className="card"><p>Checking for a valid recovery session…</p></div> : recoveryReady ? (
        <form className="card form narrow-card" onSubmit={updatePassword}>
          <h2>Choose a new password</h2>
          <p className="muted">Use a unique password with at least 14 characters. Do not reuse your authenticator setup secret.</p>
          <label>New password
            <input type="password" autoComplete="new-password" minLength={14} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          </label>
          <label>Confirm new password
            <input type="password" autoComplete="new-password" minLength={14} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          </label>
          <button type="submit" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
        </form>
      ) : (
        <form className="card form narrow-card" onSubmit={sendRecovery}>
          <h2>Send a reset link</h2>
          <label>Admin email
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <button type="submit" disabled={busy}>{busy ? "Sending…" : "Send password-reset email"}</button>
          <p className="muted small-text">For security, MMIPS does not reveal whether an email address is registered.</p>
        </form>
      )}

      {message ? <p className="notice small-notice" role="status">{message}</p> : null}
      <p><a href="/admin">Return to admin sign in</a></p>
    </main>
  );
}
