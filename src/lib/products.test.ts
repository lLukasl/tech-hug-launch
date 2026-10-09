import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { guessCategoria, interestMessage, waLink, type Product } from "./products";

describe("produtos", () => {
  it("autocategoriza celulares e acessórios", () => {
    expect(guessCategoria("iPhone 15 Pro Max")).toBe("celular");
    expect(guessCategoria("Redmi Note 13")).toBe("celular");
    expect(guessCategoria("Capa para iPhone 15")).toBe("acessorio");
    expect(guessCategoria("Película de vidro 9H")).toBe("acessorio");
  });

  it("monta a mensagem com condição, bateria e preço para o WhatsApp do Bandeirante", () => {
    const p = { categoria: "celular", nome: "iPhone 13", armazenamento: "128 GB", cor: "Azul", marca: "Apple", condicao: "seminovo", bateria: 87, preco: 2500 } as Product;
    const msg = interestMessage(p);
    expect(msg).toContain("iPhone 13 128 GB Azul — seminovo — bateria 87%");
    expect(msg).toContain("Preço: R$");
    expect(waLink(msg)).toMatch(/^https:\/\/wa\.me\/5561992337476\?text=/);
  });
});
