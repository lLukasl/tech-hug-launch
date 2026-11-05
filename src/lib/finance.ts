export type Forma = "credito" | "debito" | "pix" | "dinheiro";
export type Pagamento = { forma: Forma; valor: number };

export const FORMAS: { value: Forma; label: string }[] = [
  { value: "credito", label: "Crédito" },
  { value: "debito", label: "Débito" },
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
];

export const CASH_BUCKET = "cash-reports";

const r2 = (n: number) => Math.round(n * 100) / 100;

export const pagamentosTotal = (ps: Pagamento[]) => r2(ps.reduce((s, p) => s + (p.valor || 0), 0));

/** Dinheiro esperado na gaveta = troco inicial + vendas em dinheiro − sangrias. */
export const expectedCash = (troco: number, dinheiro: number, sangrias: number) =>
  r2(troco + dinheiro - sangrias);

/** Positivo = sobra, negativo = falta. */
export const cashDiff = (contado: number, esperado: number) => r2(contado - esperado);

export const todaySP = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

export type Periodo = "dia" | "semana" | "mes";
/** Intervalo [início, fim] (YYYY-MM-DD) do período que contém `hoje`. Semana começa na segunda. */
export function periodRange(periodo: Periodo, hoje: string): [string, string] {
  const d = new Date(`${hoje}T12:00:00Z`);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  if (periodo === "dia") return [hoje, hoje];
  if (periodo === "semana") {
    const dow = (d.getUTCDay() + 6) % 7;
    const ini = new Date(d); ini.setUTCDate(d.getUTCDate() - dow);
    const fim = new Date(ini); fim.setUTCDate(ini.getUTCDate() + 6);
    return [fmt(ini), fmt(fim)];
  }
  const ini = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const fim = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return [fmt(ini), fmt(fim)];
}

/** Intervalo do mês "YYYY-MM". */
export function monthRange(ym: string): [string, string] {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [`${ym}-01`, `${ym}-${String(last).padStart(2, "0")}`];
}

/** Valor da venda considerando o filtro de forma (só a parte paga naquela forma). */
export const saleAmountFor = (s: { total: number | string; pagamentos: Pagamento[] }, forma?: string) =>
  forma ? r2(s.pagamentos.filter((p) => p.forma === forma).reduce((a, p) => a + (p.valor || 0), 0)) : Number(s.total);

const DEVICE_RE = /\b(iphone|galaxy|redmi|xiaomi|poco|samsung|motorola|moto\s?[a-z]?\d|realme|lg|asus|zenfone|nokia|oppo|vivo|infinix|celular|smartphone|aparelho|seminovo|semi-novo|usado|\d{2,4}\s?gb|\d\s?tb)\b/i;
const ACC_RE = /\b(capa|capinha|pel[ií]cula|carregador|cabo|fone|fonte|suporte|bateria|tela|conserto|reparo|troca)\b/i;
/** Detecta venda de aparelho por palavra-chave (para vendas avulsas fora do encarte). */
export function looksLikeDevice(text: string) {
  if (!DEVICE_RE.test(text)) return false;
  if (ACC_RE.test(text) && !/\b(celular|smartphone|aparelho|seminovo|usado|\d{2,4}\s?gb)\b/i.test(text)) return false;
  return true;
}
/** Venda elegível a termo de garantia: produto do encarte ou item avulso com palavra-chave de aparelho. */
export function saleHasDevice(itens: unknown, descricao = "") {
  const list = Array.isArray(itens) ? (itens as { tipo?: string; descricao?: string }[]) : [];
  if (list.some((i) => i.tipo === "produto")) return true;
  if (list.some((i) => i.tipo !== "os" && looksLikeDevice(i.descricao ?? ""))) return true;
  return !list.length && looksLikeDevice(descricao);
}

/** Soma por forma de pagamento de uma lista de vendas. */
export function sumByForma(sales: { pagamentos: Pagamento[] }[]) {
  const out: Record<Forma, number> = { credito: 0, debito: 0, pix: 0, dinheiro: 0 };
  for (const s of sales) for (const p of s.pagamentos) out[p.forma] = r2(out[p.forma] + (p.valor || 0));
  return out;
}

export type SaleItem = {
  tipo: "avulsa" | "produto" | "os";
  ref?: string | null;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
};

export const saleItemTotal = (i: SaleItem) => r2(i.quantidade * i.preco_unitario);
export const saleItemsTotal = (items: SaleItem[]) => r2(items.reduce((s, i) => s + saleItemTotal(i), 0));

export function salePricing(subtotal: number, finalTotal: number) {
  const valid = Number.isFinite(finalTotal) && Number.isFinite(subtotal)
    && finalTotal > 0 && finalTotal <= subtotal;
  return { total: r2(finalTotal), discount: valid ? r2(subtotal - finalTotal) : 0, valid };
}

function isSaleItem(item: unknown): item is SaleItem {
  if (typeof item !== "object" || item === null) return false;
  if (!("tipo" in item) || !("descricao" in item) || !("quantidade" in item) || !("preco_unitario" in item)) return false;
  return (
    (item.tipo === "avulsa" || item.tipo === "produto" || item.tipo === "os")
    && typeof item.descricao === "string"
    && typeof item.quantidade === "number" && Number.isFinite(item.quantidade) && item.quantidade >= 0
    && typeof item.preco_unitario === "number" && Number.isFinite(item.preco_unitario) && item.preco_unitario >= 0
  );
}

/** Desconto de uma venda registrada: subtotal dos itens − total cobrado (0 se não houver). */
export function saleRecordDiscount(itens: unknown, total: number) {
  if (!Array.isArray(itens) || !Number.isFinite(total)) return 0;
  const validItems = itens.filter(isSaleItem);
  if (validItems.length !== itens.length) return 0;
  const sub = saleItemsTotal(validItems);
  return sub > total ? r2(sub - total) : 0;
}
