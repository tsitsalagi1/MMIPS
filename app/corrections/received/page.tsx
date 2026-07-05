import Link from "next/link";
import { SafetyNotice } from "../../../components/SafetyNotice";

export default function CorrectionReceivedPage() {
  return (
    <main className="container section">
      <section className="card">
        <p className="muted">Request received</p>
        <h1>Thank you. Your request was sent for review.</h1>
        <p className="lead">Nothing changes automatically. MMIPS reviews correction and removal requests before changing public case pages.</p>
        <SafetyNotice />
        <div className="button-row">
          <Link className="button" href="/corrections">Send another request</Link>
          <Link className="button secondary" href="/cases">Return to cases</Link>
        </div>
      </section>
    </main>
  );
}
