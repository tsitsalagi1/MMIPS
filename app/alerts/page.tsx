import { SafetyNotice } from "../../components/SafetyNotice";

export default function AlertsPage() {
  return (
    <main className="container section">
      <h1>Alerts</h1>
      <p className="lead">Start with email alerts. Add SMS only after opt-in, opt-out, logging, and message templates are legally reviewed and tested.</p>
      <SafetyNotice />
      <form className="card form">
        <label>Email<input type="email" placeholder="you@example.com" /></label>
        <label>Alert area<input placeholder="State, Tribe, reservation, county, city, or ZIP" /></label>
        <label className="checkbox"><input type="checkbox" /> I agree to receive MMIPS alerts for verified, family-approved or agency-supported public profiles in my selected area.</label>
        <button type="button">Join alert list</button>
      </form>
      <section className="notice"><strong>SMS later:</strong> SMS should include clear consent language and a STOP opt-out process before launch.</section>
    </main>
  );
}
