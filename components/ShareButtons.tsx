export function ShareButtons({ title, path }: { title: string; path: string }) {
  const fullUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://mmips.org"}${path}`;
  const shareText = encodeURIComponent(`MMIPS case page: ${title}`);
  const shareUrl = encodeURIComponent(fullUrl);

  return (
    <div className="share-box">
      <h3>Share this case</h3>
      <p className="muted">Only share verified, family-approved information. Send tips to the listed agency or official tip line.</p>
      <div className="button-row">
        <a className="button secondary" href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}>Share on Facebook</a>
        <a className="button secondary" href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}>Share on X</a>
        <a className="button secondary" href={`mailto:?subject=${encodeURIComponent(title)}&body=${shareUrl}`}>Email</a>
      </div>
      <label className="copy-label">Case link
        <input readOnly value={fullUrl} />
      </label>
    </div>
  );
}
