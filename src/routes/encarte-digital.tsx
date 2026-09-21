import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Cable,
  Headphones,
  MessageCircle,
  Plug,
  PlugZap,
  Smartphone,
  Tag,
  Usb,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const logo = "/clinica-cell-logo.jpeg";
const HOURS = "Seg a Sex: 8h–18h · Sáb: 8h–16h";

const WHATSAPP_NUMBER = "5561992337476";

const buyLink = (item: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Olá! Gostaria de mais informações sobre ${item} no encarte digital da Clinicacell.`,
  )}`;

export const Route = createFileRoute("/encarte-digital")({
  head: () => ({
    meta: [
      { title: "Encarte Digital — Clínica Cell" },
      {
        name: "description",
        content:
          "Acessórios, telefones novos e usados no encarte digital da Clínica Cell. Consulte valores e disponibilidade pelo WhatsApp.",
      },
      { property: "og:title", content: "Encarte Digital — Clínica Cell" },
      {
        property: "og:description",
        content:
          "Acessórios, telefones novos e usados no encarte digital da Clínica Cell. Consulte pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EncartePage,
});

const accessories: { icon: LucideIcon; name: string }[] = [
  { icon: Plug, name: "Carregadores USB-C" },
  { icon: PlugZap, name: "Carregadores USB-C / Lightning" },
  { icon: Usb, name: "Cabos USB-C" },
  { icon: Cable, name: "Cabos USB-C / Lightning" },
  { icon: Headphones, name: "Fones de Ouvido Bluetooth" },
];

const priceRanges = [
  "R$ 300 a R$ 400",
  "R$ 400 a R$ 500",
  "R$ 500 a R$ 900",
  "Acima de R$ 900",
];

function CatalogCard({
  icon: Icon,
  title,
  desc,
  waItem,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  waItem: string;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      <Button
        asChild
        className="mt-6 h-11 bg-cta text-cta-foreground shadow-cta hover:bg-cta/90"
      >
        <a href={buyLink(waItem)} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="mr-2 h-4 w-4" />
          Saiba mais
        </a>
      </Button>
    </article>
  );
}

function SectionHeader({
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
      <span className="text-sm font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h2>
      <p className="mt-4 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function EncartePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img src={logo} alt="Clínica Cell" className="w-10 h-auto" />
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              Clínica<span className="text-primary">Cell</span>
            </span>
          </Link>

          <Button
            asChild
            className="ml-auto hidden h-10 bg-cta text-cta-foreground shadow-cta hover:bg-cta/90 md:inline-flex"
          >
            <a
              href={buyLink("encarte digital")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Falar no WhatsApp
            </a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Tag className="h-3.5 w-3.5" />
            Catálogo
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
            Encarte Digital
          </h1>
          <p className="mt-4 max-w-2xl text-base text-primary-foreground/80 sm:text-lg">
            Acessórios, telefones novos e usados. Toque em “Saiba mais” para
            consultar valores e disponibilidade pelo WhatsApp.
          </p>
        </div>
      </section>

      {/* Acessórios */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader
          eyebrow="Carregadores, cabos e fones"
          title="Acessórios"
          subtitle="Consulte a disponibilidade do acessório para o modelo do seu aparelho."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accessories.map((a) => (
            <CatalogCard
              key={a.name}
              icon={a.icon}
              title={a.name}
              desc="Consulta de valores e disponibilidade pelo WhatsApp."
              waItem={a.name}
            />
          ))}
        </div>
      </section>

      {/* Telefones Novos */}
      <section className="bg-secondary/40 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Aparelhos novos"
            title="Telefones Novos"
            subtitle="Consulte os modelos e valores disponíveis no encarte digital."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <CatalogCard
              icon={Smartphone}
              title="Telefones Novos"
              desc="Categoria para aparelhos novos. Consulte modelos e valores pelo WhatsApp."
              waItem="Telefones Novos"
            />
          </div>
        </div>
      </section>

      {/* Telefones Usados / Semi-novos */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader
          eyebrow="Semi-novos e usados"
          title="Telefones Usados / Semi-novos"
          subtitle="Escolha a faixa de preço e consulte os aparelhos disponíveis."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {priceRanges.map((range) => (
            <CatalogCard
              key={range}
              icon={Tag}
              title={range}
              desc="Telefones usados e semi-novos nesta faixa de preço."
              waItem={`Telefones usados — ${range}`}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={logo}
                alt=""
                width={40}
                height={40}
                loading="lazy"
                className="h-10 w-10"
              />
              <span className="font-display text-lg font-bold">Clínica Cell</span>
            </Link>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                variant="outline"
                className="h-10 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
              >
                <Link to="/">Voltar para o início</Link>
              </Button>
              <Button
                asChild
                className="h-10 bg-cta text-cta-foreground shadow-cta hover:bg-cta/90"
              >
                <a
                  href={buyLink("encarte digital")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-8 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/60">
            <p>{HOURS}</p>
            <p className="mt-2">
              © {new Date().getFullYear()} Clínica Cell. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
