import { redirect } from "next/navigation";
import { mmipsSiteMode } from "@/lib/site-mode";

export default function FamilyRecordDownloadRedirect() {
  redirect(mmipsSiteMode() === "ca"
    ? "/forms/mmips-canada-family-record.pdf"
    : "/forms/mmips-us-family-record.pdf");
}
