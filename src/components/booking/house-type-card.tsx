"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { HouseType } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface HouseTypeCardProps {
  houseType: HouseType;
  availableCount: number;
  isSelected: boolean;
  onSelect: () => void;
}

export function HouseTypeCard({
  houseType,
  availableCount,
  isSelected,
  onSelect,
}: HouseTypeCardProps) {
  const isSoldOut = availableCount <= 0;

  return (
    <Card
      className={cn(
        "transition-all",
        isSelected && "ring-2 ring-primary",
        isSoldOut && "opacity-60"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{houseType.name}</CardTitle>
          <Badge variant={isSoldOut ? "secondary" : availableCount <= 2 ? "destructive" : "default"}>
            {isSoldOut
              ? "Ausgebucht"
              : `${availableCount} verfügbar`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {houseType.description && (
          <p className="text-sm text-muted-foreground">{houseType.description}</p>
        )}

        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            max. {houseType.max_guests} Personen
          </span>
          <span className="font-semibold">
            {formatCurrency(houseType.price_per_house)}
          </span>
        </div>

        {houseType.features.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {houseType.features.map((feature: string) => (
              <Badge key={feature} variant="outline" className="text-xs font-normal">
                {feature}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-4">
          {isSelected ? (
            <Button variant="default" className="w-full gap-2" disabled>
              <Check className="h-4 w-4" />
              Ausgewählt
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={onSelect}
            >
              {isSoldOut ? "Auf Warteliste setzen" : "Auswählen"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
