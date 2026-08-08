import type { Metadata } from "next";
import AlertActionForm from "../shared/AlertActionForm";

export const metadata: Metadata = { robots: { index: false, follow: false, noarchive: true } };

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <AlertActionForm action="confirm" token={token} title="Confirm email alerts" button="Confirm email alerts" description="Choose Confirm to finish subscribing. Simply opening this page does not activate alerts." />;
}
