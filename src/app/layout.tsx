import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/lib/config/site";
import { getActiveEvent } from "@/lib/queries/events";

// Schriften werden beim Build geladen und von der eigenen Domain ausgeliefert (keine Anfrage an Google)
const headingFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
});
const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Öffentliche Seiten werden zwischengespeichert und höchstens alle 60 Sekunden neu erzeugt.
// Nach Buchungen und Änderungen im Admin werden sie sofort aktualisiert (revalidatePath).
export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.name} | ${siteConfig.church}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.church}`,
    description: siteConfig.description,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Gemeinsam draußen: Eine Familie von hinten auf einem Wiesenweg vor einer Waldlandschaft.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const event = await getActiveEvent();
  const title = event?.title ?? siteConfig.name;

  return (
    <html lang="de" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <Header title={title} />
          <main className="flex-1">{children}</main>
          <Footer contactEmail={event?.contact_email ?? siteConfig.contactEmail} />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
