import { describe, expect, it } from "vitest";
import { cashDiff, expectedCash, pagamentosTotal } from "./finance";

describe("finance", () => {
  it("soma pagamentos divididos", () => {
    expect(pagamentosTotal([{ forma: "pix", valor: 200 }, { forma: "credito", valor: 300 }])).toBe(500);
  });
  it("dinheiro esperado = troco + vendas em dinheiro − sangrias", () => {
    expect(expectedCash(100, 250, 50)).toBe(300);
  });
  it("diferença negativa indica falta", () => {
    expect(cashDiff(280, 300)).toBe(-20);
  });
});

import { periodRange, sumByForma } from "./finance";
describe("periodRange", () => {
  it("semana começa na segunda", () => expect(periodRange("semana", "2026-05-14")).toEqual(["2026-05-11", "2026-05-17"]));
  it("mês inteiro", () => expect(periodRange("mes", "2026-02-10")).toEqual(["2026-02-01", "2026-02-28"]));
  it("soma por forma", () =>
    expect(sumByForma([{ pagamentos: [{ forma: "pix", valor: 10 }, { forma: "credito", valor: 5 }] }, { pagamentos: [{ forma: "pix", valor: 2.5 }] }]).pix).toBe(12.5));
});

import { saleItemsTotal, salePricing, saleRecordDiscount } from "./finance";
describe("venda com vários itens", () => {
  it("soma OS + acessórios extras", () => {
    expect(saleItemsTotal([
      { tipo: "os", descricao: "OS #1", quantidade: 1, preco_unitario: 250 },
      { tipo: "avulsa", descricao: "Película", quantidade: 2, preco_unitario: 29.9 },
    ])).toBe(309.8);
  });
});

describe("total negociado", () => {
  it("permite cobrar abaixo da soma sem alterar os itens", () => {
    expect(salePricing(309.8, 280)).toEqual({ total: 280, discount: 29.8, valid: true });
  });
  it("mantém o total original quando não há desconto", () => {
    expect(salePricing(309.8, 309.8)).toEqual({ total: 309.8, discount: 0, valid: true });
  });
  it("não permite total acima dos itens", () => {
    expect(salePricing(309.8, 310).valid).toBe(false);
  });
  it("não permite total negativo, zero ou inválido", () => {
    for (const total of [-1, 0, NaN, Infinity]) expect(salePricing(309.8, total).valid).toBe(false);
  });
  it("informa o desconto aplicado em uma venda registrada", () => {
    expect(saleRecordDiscount([{ tipo: "avulsa", descricao: "Item", quantidade: 1, preco_unitario: 309.8 }], 280)).toBe(29.8);
    expect(saleRecordDiscount([{ tipo: "avulsa", descricao: "Item", quantidade: 1, preco_unitario: 100 }], 100)).toBe(0);
  });
  it("ignora dados inválidos de itens ou total sem quebrar o resumo", () => {
    expect(saleRecordDiscount(null, 10)).toBe(0);
    expect(saleRecordDiscount([{ quantidade: 1 }], 10)).toBe(0);
    expect(saleRecordDiscount([], NaN)).toBe(0);
  });
});
