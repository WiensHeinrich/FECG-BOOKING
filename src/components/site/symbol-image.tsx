import Image from "next/image";
import { cn } from "@/lib/utils";

/** Stimmungsbild mit sichtbarer Kennzeichnung: kein Foto der tatsächlichen Räume oder Anlagen */
export function SymbolImage({
  src,
  alt,
  sizes,
  className,
  imageClassName,
}: {
  src: string;
  alt: string;
  sizes: string;
  /** Größe und Rundung der Bildfläche */
  className?: string;
  /** Ausschnitt, z. B. object-[50%_20%] */
  imageClassName?: string;
}) {
  return (
    <figure className={cn("relative overflow-hidden", className)}>
      <Image src={src} alt={alt} fill sizes={sizes} className={cn("object-cover", imageClassName)} />
      <figcaption className="absolute bottom-2 right-2 rounded-[6px] bg-card/90 px-2 py-[2px] text-[13px] leading-[1.5] text-muted-foreground">
        Symbolbild
      </figcaption>
    </figure>
  );
}
