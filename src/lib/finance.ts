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
