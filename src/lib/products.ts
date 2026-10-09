import { supabase } from "@/integrations/supabase/client";

export type Categoria = "celular" | "acessorio";
export type Condicao = "novo" | "seminovo" | "usado";
export type Status = "disponivel" | "vendido";

export type Product = {
  id: string;
  categoria: Categoria;
  nome: string;
  marca: string | null;
  modelo: string | null;
  armazenamento: string | null;
  cor: string | null;
  condicao: Condicao | null;
  bateria: number | null;
  compativel: string | null;
  preco: number;
  fotos: string[];
  status: Status;
  criado_em: string;
};

export type ProductWithUrls = Product & { fotoUrls: string[] };

export const PHOTO_BUCKET = "product-photos";
export const WHATSAPP_BANDEIRANTE = "5561992337476";

export const BRANDS = ["Apple", "Samsung", "Xiaomi", "Motorola", "Realme", "Outra"];
export const STORAGES = ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"];

const PHONE_WORDS = [
  "iphone",
  "galaxy",
  "redmi",
  "pixel",
  "poco",
  "moto g",
  "moto e",
  "edge",
  "realme",
  "xiaomi",
];
const ACC_WORDS = [
  "capa",
  "capinha",
  "pelicula",
  "película",
  "carregador",
  "fone",
  "suporte",
  "cabo",
  "fonte",
  "adaptador",
];

/** Sugere a categoria a partir do texto digitado; null se não identificar. */
export function guessCategoria(text: string): Categoria | null {
  const t = text.toLowerCase();
  if (ACC_WORDS.some((w) => t.includes(w))) return "acessorio";
  if (PHONE_WORDS.some((w) => t.includes(w))) return "celular";
  return null;
}

export const condicaoLabel: Record<Condicao, string> = {
  novo: "NOVO",
  seminovo: "SEMINOVO",
  usado: "USADO",
};

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function fullName(
  p: Pick<Product, "categoria" | "nome" | "armazenamento" | "cor" | "marca">,
) {
  if (p.categoria === "acessorio") return [p.nome, p.marca].filter(Boolean).join(" — ");
  return [p.nome, p.armazenamento, p.cor].filter(Boolean).join(" ");
}

export function interestMessage(p: Product) {
  const parts = [fullName(p)];
  if (p.condicao) parts.push(condicaoLabel[p.condicao].toLowerCase());
  if (p.bateria != null && p.condicao !== "novo") parts.push(`bateria ${p.bateria}%`);
  return `Olá! Tenho interesse no: ${parts.join(" — ")}. Preço: ${formatBRL(Number(p.preco))}. Está disponível? Pode me passar mais detalhes?`;
}

export function soldMessage(p: Product) {
  return `Olá! Vi que o ${fullName(p)} foi vendido no encarte digital da Clinicacell. Vocês têm algum similar disponível?`;
}

export const waLink = (msg: string) =>
  `https://wa.me/${WHATSAPP_BANDEIRANTE}?text=${encodeURIComponent(msg)}`;

export async function fetchProducts(): Promise<ProductWithUrls[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  const products = (data ?? []) as unknown as Product[];
  const paths = products.flatMap((p) => p.fotos);
  const urlMap = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(paths, 60 * 60 * 24);
    signed?.forEach((s) => s.path && s.signedUrl && urlMap.set(s.path, s.signedUrl));
  }
  return products.map((p) => ({
    ...p,
    preco: Number(p.preco),
    fotoUrls: p.fotos.map((f) => urlMap.get(f)).filter((u): u is string => !!u),
  }));
}

export const PRICE_RANGES: { label: string; min: number; max: number }[] = [
  { label: "Até R$ 300", min: 0, max: 300 },
  { label: "R$ 300 a R$ 400", min: 300, max: 400 },
  { label: "R$ 400 a R$ 500", min: 400, max: 500 },
  { label: "R$ 500 a R$ 900", min: 500, max: 900 },
  { label: "Acima de R$ 900", min: 900, max: Infinity },
];

export const inRange = (preco: number, r: { min: number; max: number }) =>
  preco >= r.min && preco < r.max;
