import Image from "next/image";
import { Quote } from "lucide-react";

export function Verse() {
  return (
    <section className="container mx-auto px-4 pb-4">
      <div className="relative overflow-hidden rounded-3xl border shadow-sm">
        <Image
          src="/images/pergament.webp"
          alt=""
          fill
          sizes="(min-width: 1280px) 1200px, 100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[oklch(0.96_0.02_80)]/35" />
        <div className="relative px-6 py-14 text-center md:px-16 md:py-20">
          <Quote className="mx-auto h-8 w-8 text-primary/70" />
          <blockquote className="mx-auto mt-5 max-w-2xl font-serif text-2xl italic leading-relaxed text-[oklch(0.28_0.05_55)] md:text-3xl">
            „Wo zwei oder drei versammelt sind in meinem Namen, da bin ich mitten unter ihnen.“
          </blockquote>
          <cite className="mt-5 block text-sm font-semibold not-italic tracking-wide text-primary">
            Matthäus 18,20
          </cite>
        </div>
      </div>
    </section>
  );
}
