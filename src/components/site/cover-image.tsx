import Image from "next/image";
import { cn } from "@/lib/utils";

/** Bild, das eine Fläche mit fester Höhe oder festem Seitenverhältnis füllt */
export function CoverImage({
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
    <div className={cn("relative overflow-hidden", className)}>
      <Image src={src} alt={alt} fill sizes={sizes} className={cn("object-cover", imageClassName)} />
    </div>
  );
}
