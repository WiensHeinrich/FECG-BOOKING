"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  src: string;
  alt: string;
  label?: string;
  className?: string;
}

export function ImagePreview({ src, alt, label = "Ansehen", className }: ImagePreviewProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("gap-1.5", className)}
        onClick={() => setOpen(true)}
      >
        <Eye className="h-4 w-4" />
        {label}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Schließen"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative h-[85vh] w-[92vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes="92vw"
              className="rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
