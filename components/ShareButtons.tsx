import Link from "next/link";

export function ShareButtons({ title, path, imageUrl }: { title: string; path: string; imageUrl?: string | null }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mmips.com";
  const fullUrl = `${siteUrl}${path}`;
  const flyerUrl = `${fullUrl}/flyer`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const emailSubject = `MMIPS public profile: ${title}`;
  const emailBodyParts = [
    `MMIPS public profile: ${title}`,
    "",
    "View the live public profile:",
    fullUrl,
    "",
    "Print or save the flyer:",
    flyerUrl
  ];

  if (imageUrl) {
    emailBodyParts.push("", "Reviewed public image:", imageUrl);
  }

  emailBodyParts.push(
    "",
    "Please share only verified, family-approved information. Send tips to the listed agency or official tip line. MMIPS is not law enforcement."
  );

  const emailBody = emailBodyParts.join("\n");
  const encodedSubject = encodeURIComponent(emailSubject);
  const encodedBody = encodeURIComponent(emailBody);
  const shareText = encodeURIComponent(`MMIPS public profile: ${title}`);
  const flyerPath = `${path}/flyer`;

  return (
    <div className="share-box">
      <h3>Share this public profile</h3>
      <p className="muted">Only share verified, family-approved information. Send tips to the listed agency or official tip line.</p>
      <div className="button-row">
        <Link className="button secondary" href={flyerPath}>Print flyer</Link>
        <a className="button secondary" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer">Share on Facebook</a>
        <a className="button secondary" href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer">Share on X</a>
        <a className="button secondary" href={`mailto:?subject=${encodedSubject}&body=${encodedBody}`}>Email with links</a>
        <a className="button secondary" href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodedSubject}&body=${encodedBody}`} target="_blank" rel="noopener noreferrer">Open in Gmail with flyer links</a>
      </div>
      <label className="copy-label">Public profile link
        <input readOnly value={fullUrl} />
      </label>
    </div>
  );
}
