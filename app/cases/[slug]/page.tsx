import { permanentRedirect } from "next/navigation";

export default async function CaseRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  permanentRedirect(`/profiles/${slug}`);
}
