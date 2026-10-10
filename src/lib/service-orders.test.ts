import { describe, expect, it } from "vitest";
import { GARANTIA_OPCOES, ordersTotal, shareOsLink } from "./service-orders";

describe("ordens de serviço", () => {
  it("soma itens: quantidade x preço unitário", () => {
    expect(ordersTotal([{ quantidade: 2, discriminacao: "a", preco_unitario: 50 }, { quantidade: 1, discriminacao: "b", preco_unitario: 120.5 }])).toBe(220.5);
  });
  it("garantia oferece 7/30/60/90/120 dias", () => {
    expect(GARANTIA_OPCOES.map((g) => g.value)).toEqual([7, 30, 60, 90, 120]);
  });
  it("envia para o número da unidade escolhida", () => {
    const url = shareOsLink({ unitId: "gama", numero: 5, cliente: "Ana", url: "https://x/os/1" });
    expect(url.startsWith("https://wa.me/5561994582288?text=")).toBe(true);
  });
});
