"use client";

export function FlyerActions() {
  return (
    <div className="flyer-actions no-print" aria-label="Flyer actions">
      <button type="button" onClick={() => window.print()}>Print flyer</button>
      <p className="muted small-text">Use your browser print dialog to print or save this flyer as a PDF.</p>
    </div>
  );
}
