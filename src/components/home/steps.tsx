import { Home, Landmark, Users } from "lucide-react";

interface StepsProps {
  reservationValidityDays: number;
}

export function Steps({ reservationValidityDays }: StepsProps) {
  const steps = [
    {
      icon: Home,
      title: "Unterkunft wählen",
      text: "Sie sehen sofort, welche Häuser noch frei sind. Grundrisse gibt es direkt zum Anschauen.",
    },
    {
      icon: Users,
      title: "Gäste eintragen",
      text: "Tragen Sie alle Personen ein, die mit Ihnen übernachten. Kinder und Hinweise wie Kinderbett oder Unverträglichkeiten gleich mit.",
    },
    {
      icon: Landmark,
      title: "Überweisen",
      text: `Nach der Anmeldung erhalten Sie die Bankdaten per E-Mail. Die Reservierung bleibt ${reservationValidityDays} Tage gültig und ist nach Zahlungseingang fest.`,
    },
  ];

  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Anmeldung
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          In drei Schritten dabei
        </h2>
      </div>

      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li
            key={title}
            className="relative rounded-2xl border bg-card p-6 pt-8 shadow-sm"
          >
            <span className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/30">
              {index + 1}
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
