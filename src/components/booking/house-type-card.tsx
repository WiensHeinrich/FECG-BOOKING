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
          "group relative cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
          isSelected && "ring-2 ring-primary shadow-md",
          isSoldOut && "opacity-70"
        )}
        onClick={onSelect}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{houseType.name}</CardTitle>
            <Badge
              className={cn(
                "text-xs",
                isSoldOut
                  ? "bg-muted text-muted-foreground"
                  : availableCount <= 2
                    ? "bg-primary/15 text-primary border-primary/25"
                    : "bg-accent text-accent-foreground border-accent"
              )}
              variant="outline"
            >
              {isSoldOut ? "Ausgebucht" : `${availableCount} verfügbar`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
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
                  className="text-xs font-normal border-border/60 bg-muted/50"
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

          <div className="mt-4 space-y-2">
            {isSelected ? (
              <Button variant="default" className="w-full gap-2" disabled>
                <Check className="h-4 w-4" />
                Ausgewählt
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
              >
                {isSoldOut ? "Auf Warteliste setzen" : "Auswählen"}
              </Button>
            )}
            {floorPlan && (
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
