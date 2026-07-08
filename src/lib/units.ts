export type Unit = {
  id: string;
  name: string;
  shortName: string;
  phone: string;
  hours: string;
  whatsapp: string;
};

const HOURS = "Seg a Sex: 8h–18h · Sáb: 8h–16h";

const toWa = (phone: string) => `https://wa.me/55${phone.replace(/\D/g, "")}`;

export const units: Unit[] = [
  {
    id: "matriz",
    name: "Matriz — Núcleo Bandeirante",
    shortName: "Núcleo Bandeirante",
    phone: "(61) 99233-7476",
    hours: HOURS,
    whatsapp: toWa("61992337476"),
  },
  {
    id: "gama",
    name: "Unidade Gama",
    shortName: "Gama",
    phone: "(61) 99458-2288",
    hours: HOURS,
    whatsapp: toWa("61994582288"),
  },
  {
    id: "sudoeste",
    name: "Unidade Sudoeste",
    shortName: "Sudoeste",
    phone: "(61) 99334-9700",
    hours: HOURS,
    whatsapp: toWa("61993349700"),
  },
  {
    id: "ponte-alta-norte",
    name: "Unidade Ponte Alta Norte",
    shortName: "Ponte Alta Norte",
    phone: "(61) 99347-9107",
    hours: HOURS,
    whatsapp: toWa("61993479107"),
  },
];
