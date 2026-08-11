import { CanadaResources } from "../../components/CanadaResources";
import { SafetyNotice } from "../../components/SafetyNotice";
import { mmipsSiteMode } from "../../lib/site-mode";

const officialLinks = [
  {
    title: "Emergency",
    body: "If someone is in immediate danger or needs urgent medical help, call 911 now.",
    href: "tel:911",
    linkText: "Call 911"
  },
  {
    title: "NamUs",
    body: "NamUs is the national system for missing, unidentified, and unclaimed people. Ask the investigating agency whether a NamUs record exists and save the NamUs number.",
    href: "https://namus.nij.ojp.gov/",
    linkText: "Open NamUs"
  },
  {
    title: "BIA Missing and Murdered Unit",
    body: "The BIA Missing and Murdered Unit provides resources and contacts for missing or murdered Indigenous people.",
    href: "https://www.bia.gov/service/mmu",
    linkText: "Open BIA MMU"
  },
  {
    title: "FBI tips",
    body: "Use the FBI tip site when the FBI is involved or an official profile or flyer tells the public to send information there.",
    href: "https://tips.fbi.gov/home",
    linkText: "Open FBI tips"
  },
  {
    title: "National Center for Missing & Exploited Children",
    body: "For a missing child, report to law enforcement first. You can also contact NCMEC at 1-800-THE-LOST (1-800-843-5678).",
    href: "https://www.missingkids.org/gethelpnow/isyourchildmissing",
    linkText: "Open NCMEC"
  },
  {
    title: "StrongHearts Native Helpline",
    body: "Confidential support for Native people and loved ones affected by domestic, dating, or sexual violence. Call 911 first for immediate danger.",
    href: "https://strongheartshelpline.org/",
    linkText: "Open StrongHearts"
  }
];

const immediateSteps = [
  "Call 911 if there is immediate danger.",
  "Contact Tribal law enforcement and the appropriate local law-enforcement agency as soon as possible. You do not need to wait 24 hours.",
  "Ask for the agency case number. Write down the investigator's or family liaison's name and contact information.",
  "Ask the investigating agency whether the person has been entered into NCIC, the national law-enforcement database.",
  "Ask whether a NamUs record has been created. Save the NamUs number or link.",
  "Ask whether the person's Tribe, Tribal police, victim-services program, the BIA Missing and Murdered Unit, or the FBI should be contacted.",
  "Gather recent photos and basic identifying information, including clothing, vehicle details, and the last known time and general area.",
  "Keep private or dangerous details off social media. Send tips and sensitive information to the official investigating agency."
];

const askFor = [
  "Agency case number",
  "Lead investigator or family liaison contact",
  "NCIC entry confirmation",
  "NamUs number or link",
  "Official tip line or public-information contact",
  "Whether a Tribal agency or BIA MMU has been notified",
  "Official flyer, if one exists",
  "What information is safe to share publicly"
];

export default function ResourcesPage() {
  if (mmipsSiteMode() === "ca") return <CanadaResources />;

  return (
    <main className="container section resources-page plain-language-page">
      <h1>Family resources</h1>
      <p className="lead">If someone you love is missing, start here. These steps can help you report the case, keep important information organized, and share public information safely.</p>
      <SafetyNotice />

      <section className="card resource-priority-card">
        <h2>If someone is missing now</h2>
        <p className="lead compact-lead">Start with official reporting. Then MMIPS can help with reviewed public awareness, profiles, flyers, and updates.</p>
        <ol className="resource-checklist">{immediateSteps.map((step) => <li key={step}>{step}</li>)}</ol>
      </section>

      <section className="feature-grid resource-link-grid" aria-label="Official and support resources">
        {officialLinks.map((resource) => (
          <div className="card" key={resource.title}>
            <h3>{resource.title}</h3><p>{resource.body}</p>
            <a className="button secondary" href={resource.href} target={resource.href.startsWith("http") ? "_blank" : undefined} rel={resource.href.startsWith("http") ? "noreferrer" : undefined}>{resource.linkText}</a>
          </div>
        ))}
      </section>

      <section className="card plain-language-section"><h2>What to ask the agency</h2><p>Keep a simple written record of who you spoke with, when you spoke, and what they told you. These details can also help MMIPS keep a public profile accurate.</p><div className="resource-chip-list">{askFor.map((item) => <span className="resource-chip" key={item}>{item}</span>)}</div></section>

      <section className="card plain-language-section"><h2>Before you share online</h2><div className="feature-grid compact-grid"><div><h3>Helpful to share</h3><p>Approved recent photos, the official contact, a broad last-known area, agency or NamUs numbers, the MMIPS profile link, and the current approved flyer.</p></div><div><h3>Keep private</h3><p>Rumors, public suspect accusations, private addresses, shelter or domestic-violence locations, graphic images, and exact sensitive locations.</p></div><div><h3>Where tips go</h3><p>Send tips to the official agency or tip line shown on the public profile. Use 911 for immediate danger. Do not send investigative tips to MMIPS.</p></div></div></section>

      <section className="card plain-language-section"><h2>Contact MMIPS</h2><p>Use these addresses for site questions, corrections, removals, privacy questions, or updates to approved public information. Do not email emergency or investigative tips to MMIPS.</p><p className="contact-line">General: <a href="mailto:contact@mmips.com">contact@mmips.com</a><br />Corrections/removals: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a><br />Legal/privacy: <a href="mailto:legal@mmips.com">legal@mmips.com</a></p></section>
    </main>
  );
}
