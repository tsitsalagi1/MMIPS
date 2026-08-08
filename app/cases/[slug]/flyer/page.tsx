import { permanentRedirect } from "next/navigation";

export default async function CaseFlyerRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  permanentRedirect(`/profiles/${slug}/flyer`);
}
