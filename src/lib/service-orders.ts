import { units } from "@/lib/units";

export type OsStatus = "aberta" | "em_andamento" | "pronta" | "entregue" | "cancelada";
export type OsItem = { quantidade: number; discriminacao: string; preco_unitario: number };

export const OS_STATUS: { value: OsStatus; label: string }[] = [
  { value: "aberta", label: "Aberta" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "pronta", label: "Pronta" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelada", label: "Cancelada" },
];

export const CANCEL_MOTIVOS = [
  "Preço alto",
  "Demora no prazo",
  "Falta de peças",
  "Desistência do cliente",
  "Aparelho inviável",
  "Outro",
];

export const LOCALIZACOES = [
  { value: "loja", label: "Na loja de origem" },
  { value: "transito", label: "Em trânsito" },
  { value: "laboratorio", label: "No laboratório de placa" },
  { value: "retornado", label: "Retornou à loja" },
];

export const PLACA_STATUS = [
  { value: "encaminhado", label: "Encaminhado para placa" },
  { value: "diagnostico", label: "Aguardando diagnóstico" },
  { value: "peca", label: "Aguardando peça / CI" },
  { value: "aprovacao", label: "Aguardando aprovação do cliente" },
  { value: "testes", label: "Recuperado / em testes" },
  { value: "concluido", label: "Concluído" },
  { value: "inviavel", label: "Inviável / sem reparo" },
];

export type BenchLog = { at: string; by: string; texto: string; local?: string; status?: string | null; responsavel?: string | null };

export const labelOf = (list: { value: string; label: string }[], v?: string | null) =>
  list.find((x) => x.value === v)?.label ?? v ?? "—";

/** Dias desde o último registro (ou abertura) — usado para destacar aparelhos parados. */
export function diasParado(createdAt: string, logs: BenchLog[], now = new Date()) {
  const last = logs.length ? logs[logs.length - 1].at : createdAt;
  return Math.floor((now.getTime() - new Date(last).getTime()) / 86400000);
}

export function placaWhatsappMsg(o: { numero: number; cliente_nome: string; modelo?: string | null; valor: number | null }) {
  const v = o.valor != null ? o.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "a confirmar";
  return `Olá, ${o.cliente_nome}! Aqui é da Clínica Cell, sobre a OS #${o.numero}${o.modelo ? ` (${o.modelo})` : ""}. Durante o diagnóstico identificamos um defeito interno na placa do aparelho. O valor do reparo de placa é ${v}. Podemos prosseguir? Responda SIM para autorizar.`;
}

export function laudoClienteMsg(o: { numero: number; cliente_nome: string; marca?: string | null; modelo?: string | null; defeito?: string | null; servicos_realizados?: string | null; placa_status_label?: string | null; valor: number | null; total?: number | null; garantia_dias?: number | null; loja_nome?: string | null; loja_tel?: string | null }) {
  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const l = [
    `Olá, ${o.cliente_nome}! Aqui é da Clínica Cell${o.loja_nome ? ` – ${o.loja_nome}` : ""}.`,
    "",
    `*Laudo técnico – OS #${o.numero}*`,
    `Aparelho: ${[o.marca, o.modelo].filter(Boolean).join(" ") || "—"}`,
  ];
  if (o.defeito) l.push(`Defeito relatado: ${o.defeito}`);
  if (o.placa_status_label) l.push(`Situação atual: ${o.placa_status_label}`);
  if (o.servicos_realizados) l.push(`Diagnóstico / serviços: ${o.servicos_realizados}`);
  if (o.valor != null) l.push(`Valor do reparo adicional: ${brl(o.valor)}`);
  if (o.total) l.push(`Valor total do orçamento: ${brl(o.total + (o.valor ?? 0))}`);
  if (o.garantia_dias) l.push(`Garantia: ${o.garantia_dias} dias`);
  l.push("", o.valor != null ? "Podemos prosseguir com o reparo? Responda *SIM* para autorizar." : "Qualquer dúvida, estamos à disposição.");
  if (o.loja_tel) l.push(`Contato da loja: ${o.loja_tel}`);
  return l.join("\n");
}

export const TIPOS_APARELHO = [
  { value: "celular", label: "Celular" },
  { value: "tablet", label: "Tablet" },
  { value: "notebook", label: "Notebook" },
  { value: "outros", label: "Outros" },
];

export const OS_BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Motorola", "Realme", "Asus", "LG", "Lenovo",
  "Nokia", "Sony", "Google", "Huawei", "Honor", "OnePlus", "Oppo", "Vivo",
  "Infinix", "Tecno", "Positivo", "Multilaser", "TCL", "Outros",
];

export const NAO_DEIXOU = [
  { value: "chip", label: "Chip" },
  { value: "cartao_memoria", label: "Cartão de memória" },
  { value: "bateria", label: "Bateria" },
  { value: "tampa_traseira", label: "Tampa traseira" },
  { value: "gaveta_chip", label: "Gaveta de chip" },
];

export const ESTADO_ENTRADA = [
  { value: "ligando", label: "Ligando normalmente" },
  { value: "desligado", label: "Desligado / não liga" },
  { value: "liquido", label: "Teve contato com líquido ou umidade" },
];

export const RISCOS_ABERTURA = [
  { value: "sem_teste", label: "Não foi possível testar câmeras, som, rede, biometria e sensores antes da abertura" },
  { value: "tela_fragil", label: "Tela já trincada/fragilizada pode danificar durante a abertura" },
  { value: "carcaca", label: "Carcaça ou chassi empenado/amassado" },
  { value: "oxidacao", label: "Suspeita de oxidação interna" },
  { value: "bateria_estufada", label: "Bateria estufada ou desgastada" },
  { value: "reparo_anterior", label: "Sinais de reparo anterior por terceiros" },
];

export const AVISO_RISCOS = `Abrir um aparelho pode revelar ou desencadear falhas em outros componentes além do serviço contratado (ex.: tela, flex, botões, câmeras, biometria, bateria), principalmente em aparelhos que sofreram quedas, contato com líquidos ou reparos anteriores. Quando o aparelho dá entrada DESLIGADO ou sem funcionar, não é possível testar suas funções antes do serviço. Nesses casos, a Clínica Cell não se responsabiliza por defeitos ocultos ou pré-existentes constatados após a abertura. Qualquer novo defeito encontrado será informado ao cliente antes de qualquer cobrança adicional.`;

/** 7 dias: bateria, pilha, carregador e fone de ouvido. Demais serviços: 30–120 dias. */
export const GARANTIA_OPCOES = [
  { value: 7, label: "7 dias (bateria, pilha, carregador, fone de ouvido)" },
  { value: 30, label: "30 dias" },
  { value: 60, label: "60 dias" },
  { value: 90, label: "90 dias" },
  { value: 120, label: "120 dias" },
];

export const TERMOS_PADRAO = `1. A Clínica Cell garante o serviço executado e a peça substituída contra defeitos de fabricação e falhas de mão de obra, pelo prazo indicado nesta ordem de serviço, contado a partir da data de entrega do aparelho.
2. Baterias, pilhas, carregadores e fones de ouvido possuem garantia de 7 (sete) dias, apenas para defeito de fabricação.
3. A garantia não cobre: quedas, impactos, trincas, contato com líquidos, umidade ou oxidação, uso indevido, abertura ou reparo por terceiros, nem defeitos não relacionados ao serviço realizado.
4. Selos de garantia rompidos ou adulterados cancelam a garantia.
5. A loja não se responsabiliza por dados, chips, cartões ou acessórios não informados nesta ordem. Recomenda-se fazer backup antes do serviço.
6. Aparelhos não retirados em até 90 dias após o aviso de conclusão poderão ser descartados ou vendidos para cobrir os custos, conforme a legislação.
7. Para acionar a garantia, apresente esta ordem de serviço.`;

export const itemTotal = (i: OsItem) => Math.round(i.quantidade * i.preco_unitario * 100) / 100;
export const ordersTotal = (items: OsItem[]) =>
  Math.round(items.reduce((s, i) => s + itemTotal(i), 0) * 100) / 100;

export const PLACA_ITEM = "Reparo de placa";
/** Rebuilds OS items after bench work: drops initial services marked unnecessary and syncs the board repair line. */
export const applyBenchToItems = (items: OsItem[], dispensados: number[], placaValor: number | null, aprovado: boolean | null): OsItem[] => {
  const base = items.filter((i, k) => i.discriminacao !== PLACA_ITEM && !dispensados.includes(k));
  if (placaValor && placaValor > 0 && aprovado !== false) base.push({ quantidade: 1, discriminacao: PLACA_ITEM, preco_unitario: placaValor });
  return base;
};

export const unitById = (id: string) => units.find((u) => u.id === id);

export function shareOsLink(opts: { unitId: string; numero: number; cliente: string; url: string }) {
  const u = unitById(opts.unitId);
  const phone = u ? u.whatsapp.replace(/\D/g, "") : "";
  const text = `Ordem de Serviço #${opts.numero} — ${opts.cliente}\nAbrir / salvar PDF: ${opts.url}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
