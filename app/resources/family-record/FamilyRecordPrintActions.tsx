"use client";

export function FamilyRecordPrintActions() {
  return (
    <button type="button" onClick={() => window.print()}>
      Print or save this record
    </button>
  );
}
