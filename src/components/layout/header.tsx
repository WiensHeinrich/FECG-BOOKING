"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <Image
            src="/logo.png"
            alt="FECG Trossingen"
            width={160}
            height={48}
            className="h-9 w-auto"
          />
          <span className="text-lg hidden sm:inline">{siteConfig.name}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:gap-2">
          {siteConfig.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative px-6 py-2 text-sm font-bold tracking-wide transition-all duration-300",
                pathname === item.href
                  ? "text-white"
                  : "text-foreground/70 hover:text-white"
              )}
            >
              <img
                src="/Pictures/Textfeld.png"
                alt=""
                className={cn(
                  "absolute inset-0 h-full w-full object-cover rounded-md transition-all duration-300",
                  pathname === item.href
                    ? "opacity-90 brightness-100"
                    : "opacity-40 brightness-75 group-hover:opacity-90 group-hover:brightness-110"
                )}
              />
              <span className="relative drop-shadow-md">{item.title}</span>
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menü öffnen</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[260px]">
            <nav className="flex flex-col gap-3 pt-8">
              {siteConfig.navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group relative px-6 py-3 text-sm font-bold tracking-wide transition-all duration-300",
                    pathname === item.href
                      ? "text-white"
                      : "text-foreground/70 hover:text-white"
                  )}
                >
                  <img
                    src="/Pictures/Textfeld.png"
                    alt=""
                    className={cn(
                      "absolute inset-0 h-full w-full object-cover rounded-md transition-all duration-300",
                      pathname === item.href
                        ? "opacity-90 brightness-100"
                        : "opacity-40 brightness-75 group-hover:opacity-90 group-hover:brightness-110"
                    )}
                  />
                  <span className="relative drop-shadow-md">{item.title}</span>
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
