
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ShareButtonsProps = {
  title: string;
  path: string;
  imageUrl?: string | null;
  statusLabel?: string;
  lastSeenLocation?: string | null;
  lastSeenDate?: string | null;
  age?: number | null;
  tribalAffiliation?: string | null;
  leadAgency?: string | null;
  agencyCaseNumber?: string | null;
  namusNumber?: string | null;
  tipPhone?: string | null;
  summary?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  let line = "";
  let currentY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export function ShareButtons({
  title,
  path,
  imageUrl,
  statusLabel = "MMIPS Public Awareness Profile",
  lastSeenLocation,
  lastSeenDate,
  age,
  tribalAffiliation,
  leadAgency,
  agencyCaseNumber,
  namusNumber,
  tipPhone,
  summary
}: ShareButtonsProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mmips.com";
  const [copyStatus, setCopyStatus] = useState<string>("");
  const [downloadStatus, setDownloadStatus] = useState<string>("");

  const shareData = useMemo(() => {
    const full = `${siteUrl}${path}`;
    const flyer = `${full}/flyer`;
    const subject = `MMIPS public profile: ${title}`;
    const plainParts = [
      `MMIPS public profile: ${title}`,
      "",
      "View the live public profile:",
      full,
      "",
      "Print, save, or download the public awareness flyer:",
      flyer
    ];

    if (imageUrl) {
      plainParts.push("", "Reviewed public image:", imageUrl);
    }

    plainParts.push(
      "",
      "Please share only verified, family-approved information. Send tips to the listed agency or official tip line. MMIPS is not law enforcement."
    );

    const plain = plainParts.join("\n");
    const imageMarkup = imageUrl
      ? `<p><a href="${escapeHtml(imageUrl)}"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)} public profile image" style="max-width:520px;width:100%;height:auto;border:1px solid #ddd;border-radius:12px;display:block;margin:12px 0;" /></a></p>`
      : "";

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.45;color:#191919;max-width:640px;">
        <h2 style="margin:0 0 10px;">MMIPS public profile: ${escapeHtml(title)}</h2>
        ${imageMarkup}
        <p><strong>View the live public profile:</strong><br><a href="${escapeHtml(full)}">${escapeHtml(full)}</a></p>
        <p><strong>Print, save, or download the public awareness flyer:</strong><br><a href="${escapeHtml(flyer)}">${escapeHtml(flyer)}</a></p>
        ${imageUrl ? `<p><strong>Reviewed public image:</strong><br><a href="${escapeHtml(imageUrl)}">${escapeHtml(imageUrl)}</a></p>` : ""}
        <p style="font-size:13px;color:#555;">Please share only verified, family-approved information. Send tips to the listed agency or official tip line. MMIPS is not law enforcement.</p>
      </div>
    `;

    return {
      fullUrl: full,
      flyerUrl: flyer,
      encodedUrl: encodeURIComponent(full),
      encodedSubject: encodeURIComponent(subject),
      encodedBody: encodeURIComponent(plain),
      shareText: encodeURIComponent(`MMIPS public profile: ${title}`),
      plainEmailBody: plain,
      richEmailHtml: html
    };
  }, [imageUrl, path, siteUrl, title]);

  async function copyRichEmail() {
    setCopyStatus("");
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([shareData.richEmailHtml], { type: "text/html" }),
            "text/plain": new Blob([shareData.plainEmailBody], { type: "text/plain" })
          })
        ]);
        setCopyStatus("Email body copied. Open Gmail and paste it into the message body.");
        return;
      }
      await navigator.clipboard.writeText(shareData.plainEmailBody);
      setCopyStatus("Plain-text share message copied. Open Gmail and paste it into the message body.");
    } catch {
      setCopyStatus("Copy failed. Use the Gmail button, then copy the profile and flyer links manually.");
    }
  }

  async function downloadJpegFlyer() {
    setDownloadStatus("Preparing JPEG flyer…");
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setDownloadStatus("Could not create flyer image on this browser.");
      return;
    }
    const drawingContext: CanvasRenderingContext2D = ctx;

    ctx.fillStyle = "#fffaf4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#b9372b";
    ctx.fillRect(70, 178, 1060, 8);

    try {
      const logo = await loadImage("/mmips-hand-transparent.png");
      ctx.drawImage(logo, 70, 54, 92, 92);
    } catch {
      ctx.fillStyle = "#b9372b";
      ctx.font = "bold 34px Arial";
      ctx.fillText("MMIPS", 70, 112);
    }

    ctx.fillStyle = "#171411";
    ctx.font = "900 22px Arial";
    ctx.fillText("MMIPS REVIEWED PUBLIC AWARENESS FLYER", 190, 82);
    ctx.font = "900 56px Arial";
    wrapText(ctx, statusLabel, 190, 145, 880, 60);

    const photoX = 74;
    const photoY = 230;
    const photoW = 320;
    const photoH = 320;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#d8c9b9";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 24);
    ctx.fill();
    ctx.stroke();

    const imgSrc = imageUrl || "/mmips-hand-white-bg.png";
    try {
      const image = await loadImage(imgSrc);
      const scale = Math.min((photoW - 24) / image.width, (photoH - 24) / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      ctx.drawImage(image, photoX + (photoW - w) / 2, photoY + (photoH - h) / 2, w, h);
    } catch {
      ctx.fillStyle = "#d8ad5d";
      ctx.font = "900 36px Arial";
      ctx.fillText("MMIPS", photoX + 92, photoY + 170);
    }

    const textX = 430;
    let y = 250;
    ctx.fillStyle = "#171411";
    ctx.font = "900 44px Arial";
    y = wrapText(ctx, title, textX, y, 680, 50) + 8;

    ctx.font = "bold 24px Arial";
    ctx.fillText(`Last seen / location: ${lastSeenLocation || "Unknown"}`, textX, y); y += 42;
    if (lastSeenDate) { ctx.fillText(`Date: ${lastSeenDate}`, textX, y); y += 42; }
    ctx.fillText(`Age: ${age ?? "Unknown"}`, textX, y); y += 42;
    ctx.fillText(`Tribal affiliation: ${tribalAffiliation || "Not publicly listed"}`, textX, y); y += 42;
    ctx.fillText(`Lead agency: ${leadAgency || "Unknown"}`, textX, y); y += 42;
    ctx.fillText(`Agency report/case #: ${agencyCaseNumber || "Unknown"}`, textX, y); y += 42;
    ctx.fillText(`NamUs #: ${namusNumber || "Unknown"}`, textX, y); y += 42;

    function drawBox(boxTitle: string, body: string, top: number, height: number) {
      drawingContext.fillStyle = "#ffffff";
      drawingContext.strokeStyle = "#d8c9b9";
      drawingContext.lineWidth = 2;
      drawingContext.beginPath();
      drawingContext.roundRect(70, top, 1060, height, 24);
      drawingContext.fill();
      drawingContext.stroke();
      drawingContext.fillStyle = "#b9372b";
      drawingContext.fillRect(70, top, 8, height);
      drawingContext.fillStyle = "#171411";
      drawingContext.font = "900 30px Arial";
      drawingContext.fillText(boxTitle, 100, top + 46);
      drawingContext.font = "22px Arial";
      wrapText(drawingContext, body, 100, top + 88, 990, 32);
    }

    drawBox("Tips / emergency information", tipPhone || "Call 911 for emergencies. Use only the official tip line listed by the investigating agency.", 610, 190);
    drawBox("Public summary", summary || "No public summary listed.", 830, 240);

    ctx.fillStyle = "#fff2cd";
    ctx.strokeStyle = "#d8ad5d";
    ctx.beginPath();
    ctx.roundRect(70, 1115, 360, 44, 22);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#6b4615";
    ctx.font = "bold 18px Arial";
    ctx.fillText("MMIPS reviewed for publication", 92, 1144);

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#b9372b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(70, 1202, 1060, 170, 20);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#8c281f";
    ctx.font = "900 22px Arial";
    ctx.fillText("VIEW THE LIVE MMIPS PUBLIC PROFILE", 100, 1245);
    ctx.fillStyle = "#0f4a7a";
    ctx.font = "bold 26px Arial";
    wrapText(ctx, shareData.fullUrl, 100, 1290, 1000, 34);

    ctx.fillStyle = "#251f1a";
    ctx.font = "18px Arial";
    wrapText(ctx, "MMIPS is not law enforcement. This flyer does not replace 911, a police report, NamUs, Tribal law enforcement, BIA MMU, FBI, or local authorities.", 70, 1430, 1060, 28);
    ctx.fillText("Corrections: corrections@mmips.com · Contact: contact@mmips.com", 70, 1525);

    canvas.toBlob((blob) => {
      if (!blob) {
        setDownloadStatus("Could not export flyer image.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "mmips-profile";
      link.href = url;
      link.download = `${safeTitle}-mmips-flyer.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setDownloadStatus("JPEG flyer downloaded.");
    }, "image/jpeg", 0.92);
  }

  return (
    <div className="share-box">
      <h3>Share this public profile</h3>
      <p className="muted">Only share verified, family-approved information. Send tips to the listed agency or official tip line.</p>
      <div className="button-row">
        <Link className="button secondary" href={`${path}/flyer`}>Print / save PDF flyer</Link>
        <button className="button secondary" type="button" onClick={downloadJpegFlyer}>Download JPEG flyer</button>
        <button className="button secondary" type="button" onClick={copyRichEmail}>Copy email body with image</button>
        <a className="button secondary" href={`mailto:?subject=${shareData.encodedSubject}&body=${shareData.encodedBody}`}>Email with links</a>
        <a className="button secondary" href={`https://mail.google.com/mail/?view=cm&fs=1&su=${shareData.encodedSubject}&body=${shareData.encodedBody}`} target="_blank" rel="noopener noreferrer">Open Gmail with links</a>
        <a className="button secondary" href={`https://www.facebook.com/sharer/sharer.php?u=${shareData.encodedUrl}`} target="_blank" rel="noopener noreferrer">Facebook</a>
        <a className="button secondary" href={`https://twitter.com/intent/tweet?text=${shareData.shareText}&url=${shareData.encodedUrl}`} target="_blank" rel="noopener noreferrer">X</a>
      </div>
      {downloadStatus ? <p className="share-status" role="status">{downloadStatus}</p> : null}
      {copyStatus ? <p className="share-status" role="status">{copyStatus}</p> : null}
      <div className="share-link-grid">
        <label className="copy-label">Public profile link
          <input readOnly value={shareData.fullUrl} onFocus={(event) => event.currentTarget.select()} />
        </label>
        <label className="copy-label">Printable flyer link
          <input readOnly value={shareData.flyerUrl} onFocus={(event) => event.currentTarget.select()} />
        </label>
      </div>
    </div>
  );
}
