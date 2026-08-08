import type { Metadata } from "next";
import AlertActionForm from "../shared/AlertActionForm";

export const metadata: Metadata = { robots: { index: false, follow: false, noarchive: true } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <AlertActionForm action="unsubscribe" token={token} title="Unsubscribe from email alerts" button="Unsubscribe" description="Choose Unsubscribe to stop future alerts. No account or explanation is required. Simply opening this page changes nothing." />;
}
