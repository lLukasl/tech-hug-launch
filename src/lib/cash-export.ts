type Row = (string | number)[];

const brl = (n: number) => n.toFixed(2).replace(".", ",");
const esc = (v: string | number) => {
  const s = String(v ?? "");
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildCashCsv(opts: {
  data: string;
  loja: string;
  trocoInicial: number;
  totals: { credito: number; debito: number; pix: number; dinheiro: number; sangrias: number; vendas: number };
  esperado: number;
  dinheiroContado: number | null;
  status: string;
  sales: { created_at: string; vendedor_email: string | null; descricao: string; pagamentos: { forma: string; valor: number }[]; total: number }[];
  withdrawals: { created_at: string; criado_por_email: string | null; valor: number; motivo: string }[];
  formaLabel: (f: string) => string;
}) {
  const t = opts.totals;
  const total = Number(t.credito) + Number(t.debito) + Number(t.pix) + Number(t.dinheiro);
  const hora = (d: string) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const rows: Row[] = [
    ["Fechamento de caixa - Clínica Cell"],
    ["Data", opts.data],
    ["Loja", opts.loja],
    ["Status", opts.status],
    ["Troco inicial (R$)", brl(opts.trocoInicial)],
    [],
    ["Resumo por forma de pagamento", "Valor (R$)"],
    ["Pix", brl(Number(t.pix))],
    ["Dinheiro", brl(Number(t.dinheiro))],
    ["Crédito", brl(Number(t.credito))],
    ["Débito", brl(Number(t.debito))],
    ["Total geral", brl(total)],
    ["Quantidade de vendas", t.vendas],
    ["Sangrias", brl(Number(t.sangrias))],
    ["Dinheiro esperado na gaveta", brl(opts.esperado)],
    ["Dinheiro contado", opts.dinheiroContado == null ? "" : brl(opts.dinheiroContado)],
    [],
    ["Vendas"],
    ["Horário", "Vendedor", "Descrição", "Pagamento", "Total (R$)"],
    ...opts.sales.map((s) => [
      hora(s.created_at),
      s.vendedor_email ?? "",
      s.descricao,
      s.pagamentos.map((p) => `${opts.formaLabel(p.forma)} ${brl(Number(p.valor))}`).join(" + "),
      brl(Number(s.total)),
    ]),
    [],
    ["Sangrias / Retiradas"],
    ["Horário", "Responsável", "Motivo", "Valor (R$)"],
    ...opts.withdrawals.map((w) => [hora(w.created_at), w.criado_por_email ?? "", w.motivo, brl(Number(w.valor))]),
  ];
  // BOM + ";" so Excel (pt-BR) opens columns correctly; Google Sheets imports it too.
  return "\uFEFF" + rows.map((r) => r.map(esc).join(";")).join("\r\n");
}

export function downloadCsv(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
