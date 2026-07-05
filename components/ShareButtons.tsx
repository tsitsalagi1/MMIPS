import Link from "next/link";

type ShareButtonsProps = {
  title: string;
  path: string;
  imageUrl?: string | null;
};

export function ShareButtons({ title, path, imageUrl }: ShareButtonsProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mmips.com";
  const fullUrl = `${siteUrl}${path}`;
  const flyerUrl = `${fullUrl}/flyer`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const emailSubject = `MMIPS case flyer: ${title}`;
  const emailBody = [
    `MMIPS reviewed case flyer: ${title}`,
    "",
    "View the live case page:",
    fullUrl,
    "",
    "Print or save the flyer:",
    flyerUrl,
    ...(imageUrl ? ["", "Reviewed public case image:", imageUrl] : []),
    "",
    "Please share only verified, family-approved information. Send tips to the listed agency or official tip line. MMIPS is not law enforcement."
  ].join("\n");
  const encodedSubject = encodeURIComponent(emailSubject);
  const encodedBody = encodeURIComponent(emailBody);
  const shareText = encodeURIComponent(`MMIPS reviewed case: ${title}`);
  const flyerPath = `${path}/flyer`;

  return (
    <div className="share-box">
      <h3>Share this case</h3>
      <p className="muted">Only share verified, family-approved information. Send tips to the listed agency or official tip line.</p>
      <div className="button-row">
        <Link className="button secondary" href={flyerPath}>Print flyer</Link>
        <a className="button secondary" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer">Share on Facebook</a>
        <a className="button secondary" href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer">Share on X</a>
        <a className="button secondary" href={`mailto:?subject=${encodedSubject}&body=${encodedBody}`}>Email with links</a>
        <a className="button secondary" href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodedSubject}&body=${encodedBody}`} target="_blank" rel="noopener noreferrer">Open in Gmail with flyer links</a>
      </div>
      <div className="share-link-grid">
        <label className="copy-label">Case link
          <input readOnly value={fullUrl} />
        </label>
        <label className="copy-label">Printable flyer link
          <input readOnly value={flyerUrl} />
        </label>
        {imageUrl ? (
          <label className="copy-label">Approved image link
            <input readOnly value={imageUrl} />
          </label>
        ) : null}
      </div>
      <p className="muted small-text">Email apps do not reliably allow a website button to attach or embed flyer images automatically. The Gmail button includes the case link and printable flyer link so recipients can open or print the reviewed flyer.</p>
    </div>
  );
}
