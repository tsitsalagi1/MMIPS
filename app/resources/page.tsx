import { SafetyNotice } from "../../components/SafetyNotice";

export default function ResourcesPage() {
  return (
    <main className="container section">
      <h1>Resources</h1>
      <p className="lead">This page should help families and advocates move information into official channels while MMIPS handles public visibility and accountability tracking.</p>
      <SafetyNotice />
      <section className="feature-grid">
        <div className="card"><h3>MMIPS contacts</h3><p>General: <a href="mailto:contact@mmips.com">contact@mmips.com</a><br />Corrections/removals: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a><br />Legal/privacy: <a href="mailto:legal@mmips.com">legal@mmips.com</a><br />Tips questions: <a href="mailto:tips@mmips.com">tips@mmips.com</a></p></div>
        <div className="card"><h3>Emergency</h3><p>Call 911 if someone is in immediate danger.</p></div>
        <div className="card"><h3>Police report</h3><p>Ask for the agency report/case number and the name/contact of the lead investigator or family liaison.</p></div>
        <div className="card"><h3>NamUs</h3><p>Ask whether the information has been submitted to NamUs and write down the NamUs number or link.</p></div>
        <div className="card"><h3>NCIC</h3><p>Ask whether the person has been entered into NCIC. Families may not receive direct NCIC access, but they can ask the agency to confirm entry.</p></div>
        <div className="card"><h3>Tribal notification</h3><p>Ask whether the relevant Tribe, tribal police, or tribal victim-services office has been notified.</p></div>
        <div className="card"><h3>Correction request</h3><p>If race, Tribe, status, or location is wrong, request written correction from the agency and keep a copy.</p></div>
      </section>
    </main>
  );
}
