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

import { applyBenchToItems as _ab, ordersTotal as _ot } from "./service-orders";
describe("bench items", () => {
  const items = [{ quantidade: 1, discriminacao: "Troca de tela", preco_unitario: 300 }];
  it("adds board repair to total", () => expect(_ot(_ab(items, [], 250, null))).toBe(550));
  it("drops unnecessary initial service", () => expect(_ot(_ab(items, [0], 250, true))).toBe(250));
  it("excludes rejected board repair", () => expect(_ot(_ab(items, [], 250, false))).toBe(300));
});
