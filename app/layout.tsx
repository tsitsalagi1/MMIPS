import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MMIPS — Missing & Murdered Indigenous People Search",
  description: "A moderated public-awareness resource for missing and murdered Indigenous people public profiles.",
  icons: {
    icon: [
      { url: "/mmips-hand-transparent.png", sizes: "1024x1024", type: "image/png" },
      { url: "/mmips-hand-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/mmips-hand-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: "MMIPS — Missing & Murdered Indigenous People Search",
    description: "Search, share, alert, and map approved MMIPS public information with care.",
    images: [{ url: "/mmips-og-white-bg.png", width: 1200, height: 630, alt: "MMIPS red handprint logo" }]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav className="container nav" aria-label="Main navigation">
            <Link href="/" className="brand" aria-label="MMIPS home">
              <img className="brand-icon" src="/mmips-hand-transparent.png" alt="" aria-hidden="true" />
              <span>MMIPS</span>
            </Link>
            <div className="nav-links">
              <Link href="/profiles">Search Profiles</Link>
              <Link href="/submit">Submit Information</Link>
              <Link href="/map">Map</Link>
              <Link href="/alerts">Alerts</Link>
              <Link href="/resources">Resources</Link>
              <Link href="/how-it-works">How it works</Link>
              <Link href="/corrections">Corrections</Link>
              <Link href="/admin">Admin</Link>
            </div>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <div className="container footer-grid">
            <div className="footer-mission">
              <p><strong>MMIPS</strong> helps families, advocates, and communities share approved public information with care. It is not law enforcement and does not replace emergency reporting or official missing-person databases.</p>
            </div>
            <nav className="footer-links" aria-label="Footer navigation">
              <Link href="/how-it-works">How it works</Link>
              <Link href="/safety-policy">Safety Policy</Link>
              <Link href="/data-policy">Data & Privacy Policy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/corrections">Correction/removal requests</Link>
            </nav>
            <div className="footer-contact" aria-label="MMIPS contact email addresses">
              <span>Contact: <a href="mailto:contact@mmips.com">contact@mmips.com</a></span>
              <span>Corrections: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a></span>
              <span>Legal/privacy: <a href="mailto:legal@mmips.com">legal@mmips.com</a></span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
