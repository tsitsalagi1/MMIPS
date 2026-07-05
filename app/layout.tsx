import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MMIPS — Missing & Murdered Indigenous People Search",
  description: "A moderated public-awareness, search, map, and accountability platform for missing and murdered Indigenous people cases."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav className="container nav" aria-label="Main navigation">
            <Link href="/" className="brand"><span className="brand-mark">M</span><span>MMIPS</span></Link>
            <div className="nav-links">
              <Link href="/cases">Search Cases</Link>
              <Link href="/submit">Submit Case</Link>
              <Link href="/map">Map</Link>
              <Link href="/alerts">Alerts</Link>
              <Link href="/resources">Resources</Link>
              <Link href="/admin">Admin</Link>
            </div>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <div className="container">
            <p><strong>MMIPS</strong> is a public-awareness and accountability project. It is not law enforcement and does not replace emergency reporting or official missing-person databases.</p>
            <p><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link></p>
          </div>
        </footer>
      </body>
    </html>
  );
}
