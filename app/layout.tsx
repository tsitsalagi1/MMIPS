import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MMIPS — Missing & Murdered Indigenous People Search",
  description: "A moderated public-awareness, search, map, and accountability platform for missing and murdered Indigenous people cases.",
  icons: {
    icon: [
      { url: "/mmips-hand-icon.svg", type: "image/svg+xml" },
      { url: "/mmips-hand-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/mmips-hand-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: "MMIPS — Missing & Murdered Indigenous People Search",
    description: "Search. Share. Alert. Map. A moderated public-awareness and accountability platform.",
    images: [{ url: "/mmips-logo.svg", width: 980, height: 240, alt: "MMIPS logo" }]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav className="container nav" aria-label="Main navigation">
            <Link href="/" className="brand" aria-label="MMIPS home">
              <img className="brand-icon" src="/mmips-hand-icon.svg" alt="" aria-hidden="true" />
              <span>MMIPS</span>
            </Link>
            <div className="nav-links">
              <Link href="/cases">Search Cases</Link>
              <Link href="/submit">Submit Case</Link>
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
          <div className="container">
            <p><strong>MMIPS</strong> is a public-awareness and accountability project. It is not law enforcement and does not replace emergency reporting or official missing-person databases.</p>
            <p><Link href="/how-it-works">How it works</Link> · <Link href="/safety-policy">Safety Policy</Link> · <Link href="/data-policy">Data & Privacy Policy</Link> · <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/corrections">Correction/removal requests</Link></p>
            <p>Contact: <a href="mailto:contact@mmips.com">contact@mmips.com</a> · Corrections: <a href="mailto:corrections@mmips.com">corrections@mmips.com</a> · Legal/privacy: <a href="mailto:legal@mmips.com">legal@mmips.com</a></p>
          </div>
        </footer>
      </body>
    </html>
  );
}
