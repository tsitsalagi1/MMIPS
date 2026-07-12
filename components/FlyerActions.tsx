"use client";

import { useState } from "react";

type FlyerExportProps = {
  title: string;
  statusLabel: string;
  profileUrl: string;
  imageUrl?: string | null;
  galleryImages?: { url: string; caption?: string | null }[];
  lastSeenLocation: string;
  lastSeenDate?: string | null;
  age?: number | null;
  tribalAffiliation?: string | null;
  leadAgency?: string | null;
  agencyCaseNumber?: string | null;
  namusNumber?: string | null;
  tipPhone?: string | null;
  summary: string;
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/).filter(Boolean);
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

export function FlyerActions(props: FlyerExportProps) {
  const [status, setStatus] = useState("");

  async function downloadJpeg() {
    setStatus("Preparing flyer image…");
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setStatus("Could not create image on this browser.");
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
    ctx.fillText("MMIPS PUBLIC AWARENESS FLYER", 190, 82);
    ctx.font = "900 58px Arial";
    ctx.fillText(props.statusLabel, 190, 145);

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

    const imgSrc = props.imageUrl || props.galleryImages?.[0]?.url || "/mmips-hand-white-bg.png";
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

    const detailImages = (props.galleryImages || []).filter((image) => image.url && image.url !== imgSrc).slice(0, 4);
    for (let i = 0; i < detailImages.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = photoX + col * 164;
      const yDetail = 566 + row * 132;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#d8c9b9";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, yDetail, 148, 104, 16);
      ctx.fill();
      ctx.stroke();
      try {
        const detail = await loadImage(detailImages[i].url);
        const scale = Math.min(132 / detail.width, 74 / detail.height);
        const w = detail.width * scale;
        const h = detail.height * scale;
        ctx.drawImage(detail, x + (148 - w) / 2, yDetail + 8 + (74 - h) / 2, w, h);
      } catch {}
      ctx.fillStyle = "#4b4037";
      ctx.font = "12px Arial";
      wrapText(ctx, detailImages[i].caption || "Detail photo", x + 8, yDetail + 92, 132, 14);
    }

    const textX = 430;
    let y = 250;
    ctx.fillStyle = "#171411";
    ctx.font = "900 44px Arial";
    y = wrapText(ctx, props.title, textX, y, 680, 50) + 8;

    ctx.font = "bold 24px Arial";
    ctx.fillText(`Last seen / location: ${props.lastSeenLocation || "Unknown"}`, textX, y); y += 42;
    if (props.lastSeenDate) { ctx.fillText(`Date: ${props.lastSeenDate}`, textX, y); y += 42; }
    ctx.fillText(`Age: ${props.age ?? "Unknown"}`, textX, y); y += 42;
    ctx.fillText(`Tribal affiliation: ${props.tribalAffiliation || "Not publicly listed"}`, textX, y); y += 42;
    ctx.fillText(`Lead agency: ${props.leadAgency || "Unknown"}`, textX, y); y += 42;
    ctx.fillText(`Agency report/case #: ${props.agencyCaseNumber || "Unknown"}`, textX, y); y += 42;
    ctx.fillText(`NamUs #: ${props.namusNumber || "Unknown"}`, textX, y); y += 42;

    function drawBox(title: string, body: string, top: number, height: number) {
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
      drawingContext.fillText(title, 100, top + 46);
      drawingContext.font = "22px Arial";
      wrapText(drawingContext, body, 100, top + 88, 990, 32);
    }

    const tipsTop = detailImages.length ? 840 : 610;
    const summaryTop = detailImages.length ? 1040 : 830;
    const linkTop = detailImages.length ? 1286 : 1202;
    const footerTop = detailImages.length ? 1452 : 1430;
    const contactTop = detailImages.length ? 1542 : 1525;

    drawBox("Tips / emergency information", props.tipPhone || "Call 911 for emergencies. Use only the official tip line listed by the investigating agency.", tipsTop, 180);
    drawBox("Public summary", props.summary || "No public summary listed.", summaryTop, detailImages.length ? 210 : 240);

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#b9372b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(70, linkTop, 1060, detailImages.length ? 142 : 170, 20);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#8c281f";
    ctx.font = "900 22px Arial";
    ctx.fillText("VIEW THE LIVE MMIPS PUBLIC PROFILE", 100, linkTop + 43);
    ctx.fillStyle = "#0f4a7a";
    ctx.font = "bold 26px Arial";
    wrapText(ctx, props.profileUrl, 100, linkTop + 84, 1000, 34);

    ctx.fillStyle = "#251f1a";
    ctx.font = "18px Arial";
    wrapText(ctx, "MMIPS is not law enforcement. This flyer does not replace 911, a police report, NamUs, Tribal law enforcement, BIA MMU, FBI, or local authorities.", 70, footerTop, 1060, 28);
    ctx.fillText("Corrections: corrections@mmips.com · Contact: contact@mmips.com", 70, contactTop);

    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus("Could not export flyer image.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTitle = props.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "mmips-profile";
      link.href = url;
      link.download = `${safeTitle}-mmips-flyer.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("JPEG flyer downloaded.");
    }, "image/jpeg", 0.92);
  }

  return (
    <div className="flyer-actions no-print" aria-label="Flyer actions">
      <button type="button" onClick={() => window.print()}>Print / save PDF</button>
      <button type="button" onClick={downloadJpeg}>Download JPEG flyer</button>
      <p className="muted small-text">Use print for paper or PDF. Use JPEG for texting, social posts, and quick sharing.</p>
      {status ? <p className="share-status" role="status">{status}</p> : null}
    </div>
  );
}
