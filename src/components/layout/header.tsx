"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
}

export function Header({ title = siteConfig.name }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo.png"
            alt="FECG Trossingen"
            width={1200}
            height={447}
            priority
            className="h-9 w-auto"
          />
          <span className="hidden truncate text-base font-semibold tracking-tight sm:inline md:text-lg">
            {title}
          </span>
        </Link>

        {/* Desktop-Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
          {siteConfig.navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                {item.title}
                <span
                  className={cn(
                    "absolute inset-x-3.5 -bottom-[13px] h-0.5 rounded-full bg-primary transition-opacity",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
              </Link>
            );
          })}
          <Button asChild size="sm" className="ml-3 gap-1.5">
            <Link href="/anmeldung">
              Jetzt anmelden
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </nav>

        {/* Mobile-Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Menü öffnen">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <SheetTitle className="px-4 pt-6 text-base font-semibold">
              {title}
            </SheetTitle>
            <nav className="flex flex-col gap-1 px-4 pt-4" aria-label="Mobile Navigation">
              {siteConfig.navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/80 hover:bg-muted"
                    )}
                  >
                    {item.title}
                  </Link>
                );
              })}
              <Button asChild className="mt-4 gap-1.5">
                <Link href="/anmeldung" onClick={() => setOpen(false)}>
                  Jetzt anmelden
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
