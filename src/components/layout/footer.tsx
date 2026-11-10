import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

interface FooterProps {
  contactEmail?: string;
}

export function Footer({ contactEmail = siteConfig.contactEmail }: FooterProps) {
  return (
    <footer className="border-t border-border">
      <div className="site-container flex flex-wrap items-center justify-between gap-x-5 gap-y-3 py-5 text-[14px] text-muted-foreground wide:py-6">
        <span>
          {siteConfig.church} · {siteConfig.slogan}
        </span>
        <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a href={`mailto:${contactEmail}`} className="transition-colors hover:text-primary">
            Kontakt
          </a>
          <Link href="/impressum" className="transition-colors hover:text-primary">
            Impressum
          </Link>
          <Link href="/datenschutz" className="transition-colors hover:text-primary">
            Datenschutz
          </Link>
          <Link
            href="/login"
            prefetch={false}
            className="text-muted-foreground/70 transition-colors hover:text-primary"
          >
            Verwaltung
          </Link>
        </span>
      </div>
    </footer>
  );
}
