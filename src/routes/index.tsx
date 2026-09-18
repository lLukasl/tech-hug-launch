import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Smartphone,
  BatteryCharging,
  Cpu,
  Plug,
  MapPin,
  MessageCircle,
  Menu,
  X,
  ShieldCheck,
  Sparkles,
  Wrench,
  ArrowRight,
  Clock,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnitSelectDialog } from "@/components/UnitSelectDialog";
import { units } from "@/lib/units";
import heroImg from "@/assets/hero-repair.jpg";

const logo = "/clinica-cell-logo.jpeg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clínica Cell — Conserto de Smartphones no DF" },
      {
        name: "description",
        content:
          "Clínica Cell: troca de tela, bateria, reparo de placa e conector de carga para smartphones em quatro unidades no Distrito Federal.",
      },
      { property: "og:title", content: "Clínica Cell — Conserto de Smartphones no DF" },
      {
        property: "og:description",
        content:
          "Serviços para smartphones e atendimento via WhatsApp nas unidades Núcleo Bandeirante, Gama, Sudoeste e Ponte Alta Norte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LandingPage,
});

const nav = [
  { href: "#inicio", label: "Início" },
  { href: "#servicos", label: "Serviços" },
  { href: "#unidades", label: "Unidades" },
  { href: "#como-funciona", label: "Como Funciona" },
  { href: "#contato", label: "Contato" },
];

const services = [
  {
    icon: Smartphone,
    title: "Troca de Tela",
    desc: "Avaliação e substituição de displays para diferentes modelos de smartphone.",
  },
  {
    icon: BatteryCharging,
    title: "Substituição de Bateria",
    desc: "Avaliação do estado da bateria e consulta sobre a substituição disponível para o aparelho.",
  },
  {
    icon: Cpu,
    title: "Reparo de Placa",
    desc: "Microssoldagem e análise técnica em placas lógicas para falhas complexas de hardware.",
  },
  {
    icon: Plug,
    title: "Problemas de Carga",
    desc: "Reparo em conectores de carga, avaliação de circuito e recomposição de portas danificadas.",
  },
];

const steps = [
  {
    icon: Wrench,
    title: "Traga seu aparelho",
    desc: "Vá até uma de nossas unidades ou solicite um orçamento online pelo WhatsApp.",
  },
  {
    icon: Search,
    title: "Diagnóstico técnico",
    desc: "A equipe avalia o aparelho e informa o orçamento antes da realização do serviço.",
  },
  {
    icon: ShieldCheck,
    title: "Execução do serviço",
    desc: "Após a aprovação do orçamento, a equipe realiza o serviço informado.",
  },
];

function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <a href="#inicio" className="flex min-w-0 items-center gap-2">
            <img src="/clinica-cell-logo.jpeg" alt="Clínica Cell" className="w-10 h-auto" />   
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              Clínica<span className="text-primary">Cell</span>
            </span>
          </a>

          <nav className="ml-auto hidden items-center gap-7 md:flex">
            {nav.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <Button
            onClick={() => setModalOpen(true)}
            className="ml-auto hidden h-10 bg-cta text-cta-foreground shadow-cta hover:bg-cta/90 md:inline-flex"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Falar no WhatsApp
          </Button>

          <button
            onClick={() => setMobileNav((v) => !v)}
            className="ml-auto grid h-10 w-10 place-items-center rounded-lg border border-border md:hidden"
            aria-label="Abrir menu"
          >
            {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileNav && (
          <div className="border-t border-border bg-background md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {nav.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileNav(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {l.label}
                </a>
              ))}
              <Button
                onClick={() => {
                  setMobileNav(false);
                  setModalOpen(true);
                }}
                className="mt-2 h-11 bg-cta text-cta-foreground hover:bg-cta/90"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Falar no WhatsApp
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="inicio" className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-20">
          <img
            src={heroImg}
            alt=""
            className="h-full w-full object-cover"
            width={1600}
            height={1200}
          />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Assitência
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Clínica Cell: cuidados para o seu{" "}
              <span className="text-accent">smartphone.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-primary-foreground/80 sm:text-lg">
              Avaliação, orçamento e serviços de tela, bateria, placa e conector de carga.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                onClick={() => setModalOpen(true)}
                size="lg"
                className="h-12 bg-cta px-6 text-cta-foreground shadow-cta hover:bg-cta/90"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Solicitar orçamento
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-primary-foreground/30 bg-primary-foreground/10 px-6 text-primary-foreground backdrop-blur hover:bg-primary-foreground/20 hover:text-primary-foreground"
              >
                <a href="#servicos">
                  Ver serviços
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-primary-foreground/20 pt-6 text-center sm:text-left">
              <div>
                <dt className="text-xs text-primary-foreground/70">Atendimento</dt>
                <dd className="mt-1 font-display text-xl font-bold">Via WhatsApp</dd>
              </div>
              <div>
                <dt className="text-xs text-primary-foreground/70">Unidades</dt>
                <dd className="mt-1 font-display text-xl font-bold">{units.length}</dd>
              </div>
            </dl>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-8 rounded-3xl bg-primary-foreground/5 blur-3xl" />
            <img
              src={heroImg}
              alt="Técnico realizando reparo em smartphone"
              width={1600}
              height={1200}
              className="relative aspect-[4/3] w-full rounded-2xl object-cover shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Nossos Serviços
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Soluções técnicas para o seu smartphone
          </h2>
          <p className="mt-4 text-muted-foreground">
            Consulte a disponibilidade do serviço para o modelo do seu aparelho.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Unidades */}
      <section id="unidades" className="bg-secondary/40 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Onde Estamos
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Nossas unidades</h2>
            <p className="mt-4 text-muted-foreground">
              Fale diretamente com a unidade mais próxima de você.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {units.map((u) => (
              <article
                key={u.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold leading-tight">
                      {u.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Endereço enviado no WhatsApp
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {u.hours}
                  </p>
                  <p className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    {u.phone}
                  </p>
                </div>

                <Button
                  asChild
                  className="mt-6 h-11 bg-cta text-cta-foreground shadow-cta hover:bg-cta/90"
                >
                  <a href={u.whatsapp} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Falar com {u.shortName}
                  </a>
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section
        id="como-funciona"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Processo
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Como funciona</h2>
          <p className="mt-4 text-muted-foreground">
            Um processo simples e transparente do início ao fim.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <span className="absolute -top-4 left-6 grid h-9 w-9 place-items-center rounded-full bg-gradient-primary font-display text-sm font-bold text-primary-foreground shadow-elegant">
                {i + 1}
              </span>
              <span className="mt-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14 text-center">
          <Button
            onClick={() => setModalOpen(true)}
            size="lg"
            className="h-12 bg-cta px-6 text-cta-foreground shadow-cta hover:bg-cta/90"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Solicitar orçamento agora
          </Button>
        </div>
      </section>

      {/* Contato / Footer */}
      <footer id="contato" className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <img
                  src={logo}
                  alt=""
                  width={40}
                  height={40}
                  loading="lazy"
                  className="h-10 w-10"
                />
                <span className="font-display text-lg font-bold">Clínica Cell</span>
              </div>
              <p className="mt-4 text-sm text-primary-foreground/70">
                Serviços de avaliação e conserto de smartphones com atendimento em quatro
                unidades no Distrito Federal.
              </p>
            </div>

            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">
                Fale Conosco
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
                <li>Contatos disponíveis na seção Unidades</li>
                <li>Seg a Sex: 8h–18h · Sáb: 8h–16h</li>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">
                Navegação
              </h3>
              <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-primary-foreground/70">
                {nav.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="hover:text-primary-foreground">
                      {l.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#" className="hover:text-primary-foreground">
                    Política de Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-foreground">
                    Termos de Uso
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/60">
            <p>
              <strong className="text-primary-foreground/80">Clínica Cell</strong> —
              Endereço da matriz e dados cadastrais disponíveis pelo atendimento da unidade
              Núcleo Bandeirante.
            </p>
            <p className="mt-2">
              © {new Date().getFullYear()} Clínica Cell. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      <UnitSelectDialog open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
