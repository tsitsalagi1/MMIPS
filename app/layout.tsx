import type { Metadata } from "next";
import Link from "next/link";
import { globalSiteUrl, mmipsSiteMode } from "../lib/site-mode";
import "./globals.css";
import "./theme-overrides.css";
import "./readability-overrides.css";

export function generateMetadata(): Metadata {
  const mode = mmipsSiteMode();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (mode === "ca" ? "https://ca.mmips.com" : "https://mmips.com");

  const title = mode === "global"
    ? "MMIPS — Choose your country or region"
    : mode === "ca"
      ? "MMIPS Canada — Missing & Murdered Indigenous People Search"
      : "MMIPS United States — Missing & Murdered Indigenous People Search";

  const description = mode === "global"
    ? "Choose the MMIPS site for your country. Each country has its own Indigenous missing-person resources, reporting information, and privacy protections."
    : mode === "ca"
      ? "Search reviewed MMIPS public profiles in Canada, explore the Canadian public-awareness map, and find resources for First Nations, Inuit and Métis families and communities."
      : "A moderated United States public-awareness resource for missing and murdered Indigenous people public profiles.";

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    icons: {
      icon: [
        { url: "/mmips-hand-transparent.png", sizes: "1024x1024", type: "image/png" },
        { url: "/mmips-hand-icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/mmips-hand-icon-512.png", sizes: "512x512", type: "image/png" }
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }]
    },
    openGraph: {
      title,
      description,
      images: [{ url: "/mmips-og-white-bg.png", width: 1200, height: 630, alt: "MMIPS red handprint logo" }]
    }
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const mode = mmipsSiteMode();

  return (
    <html lang={mode === "ca" ? "en-CA" : "en"}>
      <body>
        {mode === "global" ? <GlobalHeader /> : mode === "ca" ? <CanadaHeader /> : <UnitedStatesHeader />}
        {children}
        {mode === "global" ? <GlobalFooter /> : mode === "ca" ? <CanadaFooter /> : <UnitedStatesFooter />}
      </body>
    </html>
  );
}

function GlobalHeader() {
  return (
    <header className="site-header">
      <nav className="container nav" aria-label="Global MMIPS navigation">
        <Link href="/" className="brand" aria-label="MMIPS Global home">
          <img className="brand-icon" src="/mmips-hand-transparent.png" alt="" aria-hidden="true" />
          <span>MMIPS</span>
        </Link>
        <div className="nav-links">
          <span>Choose a country</span>
        </div>
      </nav>
    </header>
  );
}

function CanadaHeader() {
  return (
    <header className="site-header">
      <nav className="container nav" aria-label="Canada MMIPS navigation">
        <Link href="/" className="brand" aria-label="MMIPS Canada home">
          <img className="brand-icon" src="/mmips-hand-transparent.png" alt="" aria-hidden="true" />
          <span>MMIPS Canada</span>
        </Link>
        <div className="nav-links">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/profiles">Search Profiles</Link>
          <Link href="/alerts">Alerts</Link>
          <Link href="/resources">Family Resources</Link>
          <Link href="/submit">Submit Information</Link>
          <a href={globalSiteUrl()}>Canada · Change country</a>
        </div>
      </nav>
    </header>
  );
}

function UnitedStatesHeader() {
  const globalUrl = process.env.NEXT_PUBLIC_GLOBAL_SITE_URL;

  return (
    <header className="site-header">
      <nav className="container nav" aria-label="United States MMIPS navigation">
        <Link href="/" className="brand" aria-label="MMIPS United States home">
          <img className="brand-icon" src="/mmips-hand-transparent.png" alt="" aria-hidden="true" />
          <span>MMIPS</span>
        </Link>
        <div className="nav-links">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/profiles">Search Profiles</Link>
          <Link href="/alerts">Alerts</Link>
          <Link href="/resources">Family Resources</Link>
          <Link href="/submit">Submit Information</Link>
          {globalUrl ? <a href={globalUrl}>United States · Change country</a> : null}
        </div>
      </nav>
    </header>
  );
}

function GlobalFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-mission">
          <p><strong>MMIPS Global</strong> helps you find the MMIPS site for your country. Case information stays with each country site.</p>
        </div>
        <div className="footer-contact" aria-label="MMIPS Global contact email address">
          <span>Contact: <a href="mailto:contact@mmips.com">contact@mmips.com</a></span>
        </div>
      </div>
    </footer>
  );
}

function CanadaFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-mission">
          <p><strong>MMIPS Canada</strong> helps people find public information about missing and murdered Indigenous people and resources for families. MMIPS is not police or an emergency service.</p>
        </div>
        <nav className="footer-links" aria-label="MMIPS Canada footer navigation">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/profiles">Search Profiles</Link>
          <Link href="/alerts">Alerts</Link>
          <Link href="/resources">Family Resources</Link>
          <Link href="/submit">Submit Information</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <div className="footer-contact" aria-label="MMIPS Canada contact and country navigation">
          <span>Contact: <a href="mailto:contact@mmips.com">contact@mmips.com</a></span>
          <span>Corrections/removals: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a></span>
          <span>Legal/privacy: <a href="mailto:legal@mmips.com">legal@mmips.com</a></span>
          <span><a href={globalSiteUrl()}>Change country</a></span>
        </div>
      </div>
    </footer>
  );
}

function UnitedStatesFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-mission">
          <p><strong>MMIPS United States</strong> helps families, advocates, Tribes, and communities share approved public information with care. It is not law enforcement and does not replace emergency reporting or official missing-person databases.</p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/profiles">Search Profiles</Link>
          <Link href="/alerts">Alerts</Link>
          <Link href="/resources">Family Resources</Link>
          <Link href="/corrections">Correction/removal requests</Link>
          <Link href="/safety-policy">Safety Policy</Link>
          <Link href="/data-policy">Data & Privacy Policy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <div className="footer-contact" aria-label="MMIPS contact email addresses">
          <span>Contact: <a href="mailto:contact@mmips.com">contact@mmips.com</a></span>
          <span>Corrections: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a></span>
          <span>Legal/privacy: <a href="mailto:legal@mmips.com">legal@mmips.com</a></span>
        </div>
      </div>
    </footer>
  );
}
