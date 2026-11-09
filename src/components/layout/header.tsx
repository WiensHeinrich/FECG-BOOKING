"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { siteConfig, splitEventTitle } from "@/lib/config/site";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
}

export function Header({ title = siteConfig.name }: HeaderProps) {
  const pathname = usePathname();
  const { label, year } = splitEventTitle(title);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="border-b border-border bg-background">
      <div className="site-container flex flex-wrap items-center justify-between gap-x-5 gap-y-3 py-[17px] wide:py-5">
        <Link href="/" className="flex items-center gap-[15px]" aria-label="Zur Startseite">
          <Image
            src="/logo.png"
            alt="FECG Trossingen"
            width={1200}
            height={447}
            priority
            className="h-auto w-[90px] wide:w-[100px]"
          />
          <span className="hidden border-l border-border pl-[15px] text-[12px] leading-[1.5] text-foreground wide:block">
            {label}
            {year && (
              <>
                <br />
                <strong>{year}</strong>
              </>
            )}
          </span>
        </Link>

        <nav
          className="flex flex-wrap items-center gap-[17px] wide:gap-6"
          aria-label="Hauptnavigation"
        >
          {siteConfig.navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "py-2 text-[12px] transition-colors wide:text-[13px]",
                  item.hideOnMobile && "hidden wide:inline-block",
                  active
                    ? "text-primary shadow-[0_2px_0_var(--brand)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.title}
              </Link>
            );
          })}
          <Link
            href="/anmeldung"
            className="btn-primary min-h-0 px-3 py-2.5 text-[12px] wide:min-h-[46px] wide:px-[18px] wide:py-3 wide:text-[14px]"
          >
            Zur Anmeldung
            <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
