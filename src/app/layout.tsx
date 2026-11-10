import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/lib/config/site";
import { getActiveEvent } from "@/lib/queries/events";

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
    <html lang="de">
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
