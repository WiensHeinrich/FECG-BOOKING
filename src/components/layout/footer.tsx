import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { siteConfig } from "@/lib/config/site";

interface FooterProps {
  title?: string;
  contactEmail?: string;
  contactPhone?: string | null;
}

export function Footer({
  title = siteConfig.name,
  contactEmail = siteConfig.contactEmail,
  contactPhone,
}: FooterProps) {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Image
              src="/logo.png"
              alt="FECG Trossingen"
              width={1200}
              height={447}
              className="h-10 w-auto"
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {title} der {siteConfig.church}. Gemeinsam. Glauben. Erleben.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
              Seiten
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {siteConfig.navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
              Kontakt
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-2 transition-colors hover:text-primary"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="break-all">{contactEmail}</span>
                </a>
              </li>
              {contactPhone && (
                <li>
                  <a
                    href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                    className="transition-colors hover:text-primary"
                  >
                    {contactPhone}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.church}
          </p>
          <Link href="/login" className="transition-colors hover:text-primary">
            Admin-Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
