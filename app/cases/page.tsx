import { permanentRedirect } from "next/navigation";

export default function CasesRedirectPage() {
  permanentRedirect("/profiles");
}
