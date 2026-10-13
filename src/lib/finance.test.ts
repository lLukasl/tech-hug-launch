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
