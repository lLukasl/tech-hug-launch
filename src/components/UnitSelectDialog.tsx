import { useState } from "react";
import { MapPin, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { units } from "@/lib/units";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function UnitSelectDialog({ open, onOpenChange }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Qual unidade está mais próxima de você?
          </DialogTitle>
          <DialogDescription>
            Escolha a loja para falar direto no WhatsApp com nossa equipe.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-2">
          {units.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(u.id)}
              className={`group flex items-start gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary hover:bg-accent/50 ${
                selected === u.id ? "border-primary bg-accent/60" : "border-border"
              }`}
            >
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {u.name}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {u.address}
                </span>
              </span>
            </button>
          ))}
        </div>

        <Button
          asChild
          disabled={!selected}
          className="mt-2 h-12 w-full bg-cta text-cta-foreground shadow-cta hover:bg-cta/90"
        >
          <a
            href={selected ? units.find((u) => u.id === selected)?.whatsapp : "#"}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!selected}
            onClick={(e) => {
              if (!selected) e.preventDefault();
            }}
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Falar no WhatsApp
          </a>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
