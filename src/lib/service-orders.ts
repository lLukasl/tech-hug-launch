import { units } from "@/lib/units";

export type OsStatus = "aberta" | "em_andamento" | "pronta" | "entregue";
export type OsItem = { quantidade: number; discriminacao: string; preco_unitario: number };

export const OS_STATUS: { value: OsStatus; label: string }[] = [
  { value: "aberta", label: "Aberta" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "pronta", label: "Pronta" },
  { value: "entregue", label: "Entregue" },
];

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

export const unitById = (id: string) => units.find((u) => u.id === id);

export function shareOsLink(opts: { unitId: string; numero: number; cliente: string; url: string }) {
  const u = unitById(opts.unitId);
  const phone = u ? u.whatsapp.replace(/\D/g, "") : "";
  const text = `Ordem de Serviço #${opts.numero} — ${opts.cliente}\nAbrir / salvar PDF: ${opts.url}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
