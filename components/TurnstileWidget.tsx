import Script from "next/script";

export function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return (
      <div className="notice warning small-notice">
        <strong>Spam protection not configured.</strong> Add NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY in Vercel before public intake.
      </div>
    );
  }

  return (
    <div className="turnstile-wrap">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="dark" />
      <p className="muted small-text">This verification helps protect families from spam and malicious submissions.</p>
    </div>
  );
}
