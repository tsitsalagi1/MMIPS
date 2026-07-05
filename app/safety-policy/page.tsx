import Link from "next/link";
import { SafetyNotice } from "../../components/SafetyNotice";

export default function SafetyPolicyPage() {
  return (
    <main className="container section legal-body">
      <h1>Safety Policy</h1>
      <p className="lead">
        MMIPS is designed around one rule: public awareness should never endanger a person, family, witness, survivor,
        search effort, or investigation.
      </p>
      <SafetyNotice />

      <h2>Before a case is published</h2>
      <p>MMIPS should review each case for:</p>
      <ul>
        <li>Family, authorized advocate, Tribal representative, legal representative, law-enforcement representative, or other authorized-submitter basis.</li>
        <li>No public suspect accusations unless supported by official public charges or official public statements.</li>
        <li>No exact private addresses, shelter locations, unsafe domestic-violence locations, or sensitive minor/trafficking locations.</li>
        <li>Official or family-approved tip contact information.</li>
        <li>Clear status labels such as missing, murdered/unsolved, unidentified, resolved, or unknown.</li>
      </ul>

      <h2>Prohibited public content</h2>
      <p>MMIPS should not knowingly publish:</p>
      <ul>
        <li>Rumors, public suspect accusations, harassment, threats, or vigilante language.</li>
        <li>Exact private addresses or location details that could endanger anyone.</li>
        <li>Graphic images or unnecessary graphic descriptions.</li>
        <li>Private submitter contact information unless specifically approved for public release.</li>
        <li>Confidential investigative details.</li>
      </ul>

      <h2>Location masking</h2>
      <p>
        Public case pages should use city, county, reservation, or general area when exact location information creates risk.
        For minors, trafficking concerns, domestic violence, shelters, witness safety, or active investigations, location should be generalized or hidden.
      </p>

      <h2>Corrections and removals</h2>
      <p>
        Families, authorized advocates, Tribal representatives, official contacts, and legal/privacy contacts can request correction,
        hiding, or removal of public case information. MMIPS may hide public information while a request is reviewed.
      </p>

      <h2>Emergency and official reporting</h2>
      <p>
        MMIPS does not replace 911, police reports, NamUs, NCIC, Tribal police, BIA MMU, FBI, local authorities, or victim services.
        If someone is in immediate danger, call 911 first.
      </p>

      <div className="button-row">
        <Link className="button" href="/corrections">Request correction/removal</Link>
        <Link className="button secondary" href="/how-it-works">How MMIPS works</Link>
      </div>
    </main>
  );
}
