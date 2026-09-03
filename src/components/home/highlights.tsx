import Image from "next/image";
import { Flame, Music, TreePine, UtensilsCrossed } from "lucide-react";

const highlights = [
  {
    icon: TreePine,
    label: "Wanderungen",
    verse: "„Die Himmel erzählen die Ehre Gottes, und die Feste verkündigt seiner Hände Werk.“",
    reference: "Psalm 19,2",
    text: "Gemeinsam entdecken wir Gottes wunderbare Schöpfung auf den Wegen durch den Schwarzwald.",
    image: "/images/wanderung.webp",
  },
  {
    icon: Music,
    label: "Lobpreis",
    verse: "„Singt dem Herrn ein neues Lied, denn er tut Wunder.“",
    reference: "Psalm 98,1",
    text: "Unser gemeinsamer Lobpreis öffnet Herzen und bringt uns als Gemeinde näher zu Gott und zueinander.",
    image: "/images/lobpreis.webp",
  },
  {
    icon: Flame,
    label: "Lagerfeuer",
    verse: "„Brannte nicht unser Herz, als er mit uns redete?“",
    reference: "Lukas 24,32",
    text: "Am Feuer kommen wir zusammen, erzählen, singen und spüren, wie Gott mitten unter uns ist.",
    image: "/images/lagerfeuer.webp",
  },
  {
    icon: UtensilsCrossed,
    label: "Gemeinschaft",
    verse: "„Sie waren täglich einmütig beieinander und brachen das Brot in den Häusern.“",
    reference: "Apostelgeschichte 2,46",
    text: "Gemeinsam essen, lachen und füreinander da sein. Gelebter Glaube im Alltag.",
    image: "/images/gemeinschaft.webp",
  },
];

export function Highlights() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Was uns erwartet
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Ein Wochenende, das verbindet
        </h2>
        <p className="mt-4 text-muted-foreground">
          Zeit für Gott, Zeit füreinander und Zeit zum Durchatmen mitten im Schwarzwald.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map(({ icon: Icon, label, verse, reference, text, image }) => (
          <article
            key={label}
            className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
          >
            <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
              <Image
                src={image}
                alt={label}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="text-lg font-bold">{label}</h3>
              </div>
              <p className="mt-3 text-sm italic leading-relaxed text-foreground/80">{verse}</p>
              <p className="mt-1 text-xs font-semibold text-primary">{reference}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
