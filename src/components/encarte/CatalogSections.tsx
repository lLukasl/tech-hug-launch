import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  PRICE_RANGES,
  condicaoLabel,
  fetchProducts,
  formatBRL,
  fullName,
  inRange,
  interestMessage,
  soldMessage,
  waLink,
  type ProductWithUrls,
} from "@/lib/products";

const USED_NOTE =
  "Produto pode apresentar marcas de uso como arranhões na tela ou carcaça. Fotos reais do produto.";

function Header({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="max-w-2xl">
      <span className="text-sm font-semibold uppercase tracking-wider text-primary">{eyebrow}</span>
      <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h2>
      <p className="mt-4 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function WaButton({ p, className }: { p: ProductWithUrls; className?: string }) {
  const sold = p.status === "vendido";
  return (
    <Button
      asChild
      className={`h-11 bg-cta text-cta-foreground shadow-cta hover:bg-cta/90 ${className ?? ""}`}
    >
      <a
        href={waLink(sold ? soldMessage(p) : interestMessage(p))}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        <MessageCircle className="mr-2 h-4 w-4 shrink-0" />
        <span className="truncate">
          {sold ? "Produto vendido — perguntar sobre similares" : "Comprar pelo WhatsApp"}
        </span>
      </a>
    </Button>
  );
}

function ProductCard({ p, onOpen }: { p: ProductWithUrls; onOpen: () => void }) {
  const sold = p.status === "vendido";
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
      <button type="button" onClick={onOpen} className="text-left">
        <div className="relative aspect-[4/5] bg-muted">
          {p.fotoUrls[0] ? (
            <img
              src={p.fotoUrls[0]}
              alt={fullName(p)}
              loading="lazy"
              className={`h-full w-full object-cover ${sold ? "opacity-70" : ""}`}
            />
          ) : (
            <Smartphone className="absolute inset-0 m-auto h-10 w-10 text-muted-foreground" />
          )}
          {sold ? (
            <span className="absolute inset-0 grid place-items-center">
              <span className="-rotate-12 rounded-md bg-primary/75 px-5 py-2 text-xl font-bold tracking-widest text-primary-foreground">
                VENDIDO
              </span>
            </span>
          ) : (
            p.condicao && (
              <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                {condicaoLabel[p.condicao]}
              </span>
            )
          )}
        </div>
        <div className="p-4 pb-0">
          <h3 className="font-semibold leading-snug">{fullName(p)}</h3>
          <p className="mt-1 text-lg font-bold text-primary">{formatBRL(p.preco)}</p>
        </div>
      </button>
      <div className="mt-auto p-4">
        <WaButton p={p} className="w-full" />
      </div>
    </article>
  );
}

function Grid({
  items,
  onOpen,
  empty,
}: {
  items: ProductWithUrls[];
  onOpen: (p: ProductWithUrls) => void;
  empty: string;
}) {
  if (!items.length) return <p className="mt-8 text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} p={p} onOpen={() => onOpen(p)} />
      ))}
    </div>
  );
}

function Spec({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export function CatalogSections() {
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const [open, setOpen] = useState<ProductWithUrls | null>(null);
  const products = data ?? [];
  const acc = products.filter((p) => p.categoria === "acessorio");
  const novos = products.filter((p) => p.categoria === "celular" && p.condicao === "novo");
  const usados = products.filter((p) => p.categoria === "celular" && p.condicao !== "novo");

  if (isLoading)
    return (
      <div className="py-20">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <Header
          eyebrow="Carregadores, cabos e fones"
          title="Acessórios"
          subtitle="Toque no produto para ver fotos e detalhes."
        />
        <Grid items={acc} onOpen={setOpen} empty="Nenhum acessório no encarte no momento." />
      </section>

      <section className="bg-secondary/40 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Header
            eyebrow="Aparelhos novos"
            title="Telefones Novos"
            subtitle="Modelos novos disponíveis no encarte digital."
          />
          <Grid
            items={novos}
            onOpen={setOpen}
            empty="Nenhum telefone novo no encarte no momento."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <Header
          eyebrow="Semi-novos e usados"
          title="Telefones Usados / Semi-novos"
          subtitle="Organizados por faixa de preço."
        />
        {usados.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">
            Nenhum aparelho usado no encarte no momento.
          </p>
        )}
        {PRICE_RANGES.map((r) => {
          const items = usados.filter((p) => inRange(p.preco, r));
          if (!items.length) return null;
          return (
            <div key={r.label} className="mt-10">
              <h3 className="text-xl font-bold">{r.label}</h3>
              <Grid items={items} onOpen={setOpen} empty="" />
            </div>
          );
        })}
      </section>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{fullName(open)}</DialogTitle>
              </DialogHeader>
              <div className="flex snap-x gap-3 overflow-x-auto">
                {open.fotoUrls.map((u, i) => (
                  <img
                    key={i}
                    src={u}
                    alt={`${fullName(open)} — foto ${i + 1}`}
                    className="aspect-[4/5] w-4/5 shrink-0 snap-center rounded-lg object-cover sm:w-1/2"
                  />
                ))}
              </div>
              {open.condicao && open.condicao !== "novo" && (
                <p className="text-xs text-muted-foreground">{USED_NOTE}</p>
              )}
              <dl>
                <Spec label="Preço" value={formatBRL(open.preco)} />
                <Spec label="Marca" value={open.marca} />
                <Spec label="Armazenamento" value={open.armazenamento} />
                <Spec label="Cor" value={open.cor} />
                <Spec
                  label="Condição"
                  value={open.condicao ? condicaoLabel[open.condicao] : null}
                />
                <Spec
                  label="Saúde da bateria"
                  value={open.bateria != null ? `${open.bateria}%` : null}
                />
                <Spec label="Compatível com" value={open.compativel} />
                <Spec label="Status" value={open.status === "vendido" ? "Vendido" : "Disponível"} />
              </dl>
              <WaButton p={open} className="w-full" />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
