export type Unit = {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  whatsapp: string; // full wa.me link
};

export const units: Unit[] = [
  {
    id: "matriz",
    name: "Unidade Matriz — Centro",
    address: "Av. Principal, 1000 — Centro, Sua Cidade — UF",
    phone: "(00) 0000-0000",
    hours: "Seg a Sex: 9h–18h · Sáb: 9h–13h",
    whatsapp: "https://wa.me/seu-numero-loja1",
  },
  {
    id: "shopping",
    name: "Unidade Shopping",
    address: "Shopping Central, Loja 42 — Sua Cidade — UF",
    phone: "(00) 0000-0001",
    hours: "Seg a Sáb: 10h–22h · Dom: 14h–20h",
    whatsapp: "https://wa.me/seu-numero-loja2",
  },
  {
    id: "zona-sul",
    name: "Unidade Zona Sul",
    address: "Rua das Palmeiras, 250 — Zona Sul, Sua Cidade — UF",
    phone: "(00) 0000-0002",
    hours: "Seg a Sex: 9h–19h · Sáb: 9h–14h",
    whatsapp: "https://wa.me/seu-numero-loja3",
  },
];
