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
