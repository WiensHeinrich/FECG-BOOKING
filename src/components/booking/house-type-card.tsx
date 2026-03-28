"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Check, Eye, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { HouseType } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface HouseTypeCardProps {
  houseType: HouseType;
  availableCount: number;
  isSelected: boolean;
  onSelect: () => void;
}

const floorPlanMap: Record<string, string> = {
  "ferienhaus-typ-ab": "/docs/grundriss-typ-a.pdf",
  "ferienhaus-typ-c": "/docs/grundriss-typ-c.pdf",
  "ferienhaus-typ-c-10": "/docs/grundriss-typ-c.pdf",
  "ferienhaus-typ-c-8": "/docs/grundriss-typ-c.pdf",
  "gaestehaus-g1-10": "/docs/grundriss-gaestehaus.pdf",
  "gaestehaus-g11": "/docs/grundriss-gaestehaus.pdf",
};

export function HouseTypeCard({
  houseType,
  availableCount,
  isSelected,
  onSelect,
}: HouseTypeCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const isSoldOut = availableCount <= 0;
  const floorPlan = floorPlanMap[houseType.slug];

  return (
    <>
      <Card
        className={cn(
          "group relative flex flex-col cursor-pointer overflow-hidden transition-all duration-300",
          "hover:shadow-lg hover:-translate-y-1",
          isSelected && "ring-2 ring-primary shadow-lg",
          isSoldOut && "opacity-70"
        )}
        onClick={onSelect}
      >
        {/* Hover-Schimmer-Effekt */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/0 via-accent/0 to-primary/0 transition-all duration-500 group-hover:from-primary/[0.06] group-hover:via-accent/[0.08] group-hover:to-primary/[0.04]" />
        <div className="pointer-events-none absolute -inset-1 bg-gradient-to-r from-transparent via-white/0 to-transparent transition-all duration-700 group-hover:via-white/[0.12] group-hover:translate-x-full" />

        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg transition-colors duration-300 group-hover:text-primary">{houseType.name}</CardTitle>
            <Badge
              className={cn(
                "text-xs shrink-0 transition-colors duration-300",
                isSoldOut
                  ? "bg-muted text-muted-foreground"
                  : availableCount <= 2
                    ? "bg-primary/15 text-primary border-primary/25"
                    : "bg-accent text-accent-foreground border-accent group-hover:bg-primary/15 group-hover:text-primary group-hover:border-primary/25"
              )}
              variant="outline"
            >
              {isSoldOut ? "Ausgebucht" : `${availableCount} verfügbar`}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative flex flex-1 flex-col">
          {houseType.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {houseType.description}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              max. {houseType.max_guests} Personen
            </span>
            <div className="text-right">
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(houseType.price_per_house)}
              </span>
              <p className="text-[11px] text-muted-foreground">zzgl. Kurtaxe</p>
            </div>
          </div>

          {houseType.features.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {houseType.features.slice(0, 5).map((feature: string) => (
                <Badge
                  key={feature}
                  variant="outline"
                  className="text-xs font-normal border-border/60 bg-muted/50 transition-colors duration-300 group-hover:border-primary/20 group-hover:bg-primary/[0.06]"
                >
                  {feature}
                </Badge>
              ))}
              {houseType.features.length > 5 && (
                <Badge variant="outline" className="text-xs font-normal border-border/60 bg-muted/50">
                  +{houseType.features.length - 5} mehr
                </Badge>
              )}
            </div>
          )}

          {/* Spacer schiebt Buttons nach unten */}
          <div className="flex-1" />

          <div className="mt-4 space-y-2">
            {isSelected ? (
              <Button variant="default" className="w-full gap-2" disabled>
                <Check className="h-4 w-4" />
                Ausgewählt
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:shadow-md group-hover:shadow-primary/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
              >
                {isSoldOut ? "Auf Warteliste setzen" : "Auswählen"}
              </Button>
            )}
            {floorPlan ? (
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(true);
                }}
              >
                <Eye className="h-3.5 w-3.5" />
                Grundriss ansehen
              </button>
            ) : (
              <div className="h-5" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grundriss-Vorschau Modal */}
      {showPreview && floorPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="relative flex h-[90vh] w-[90vw] max-w-6xl flex-col rounded-xl bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold">
                Grundriss — {houseType.name}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPreview(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden bg-white">
              <iframe
                src={floorPlan}
                className="h-full w-full"
                title={`Grundriss ${houseType.name}`}
              />
            </div>
            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline" asChild>
                <a href={floorPlan} download>
                  PDF herunterladen
                </a>
              </Button>
              <Button onClick={() => { setShowPreview(false); onSelect(); }}>
                {isSoldOut ? "Auf Warteliste setzen" : "Auswählen"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
