import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Topic = { title: string; steps: string[] };

const SELLER: Topic[] = [
  {
    title: "Entrar e sair do sistema",
    steps: [
      "Acesse /admin e entre com o e-mail e a senha criados pelo seu gerente.",
      "Para sair, clique em \"Sair\" no topo da página.",
      "Você só vê os dados da loja à qual está vinculado.",
    ],
  },
  {
    title: "Adicionar um produto ao encarte",
    steps: [
      "Na aba Produtos, clique em \"Novo Produto\".",
      "Preencha marca, modelo, preço, condição e envie as fotos.",
      "Clique em salvar. O produto aparece no Encarte Digital do site.",
      "Para marcar como vendido, use a chave \"Vendido/Disponível\" no cartão do produto.",
    ],
  },
  {
    title: "Criar uma Ordem de Serviço (OS)",
    steps: [
      "Na aba Ordens de Serviço, clique em nova OS.",
      "Informe cliente, telefone, tipo de aparelho, marca, modelo, cor e o que o cliente não deixou (chip, cartão, etc.).",
      "Marque como o aparelho chegou (ligando, desligado ou com líquido) e os danos que ele já tinha.",
      "Leia o aviso de riscos com o cliente e confirme que ele foi avisado.",
      "Adicione os serviços (quantidade, descrição, preço) e escolha a garantia.",
      "Colete as assinaturas da Clínica Cell e do cliente e salve.",
      "Use o botão de PDF/WhatsApp para enviar a OS ao cliente.",
      "Dá para abrir a OS pelo celular ou tablet do balcão: os campos e os filtros se ajustam ao tamanho da tela.",
    ],
  },
  {
    title: "Triagem de placa no balcão",
    steps: [
      "Na nova OS, em \"Tipo de atendimento\" escolha \"Suspeita de problema de placa\". Marcando \"Reparo padrão (tela, conector, bateria…)\", a OS segue a sequência normal.",
      "Marque ao menos um sintoma: não liga / consumo zerado, em curto / esquenta, reinicia sozinho / não inicia o sistema, sem sinal de rede, sem áudio ou microfone, não carrega mesmo com conector novo, contato com líquido / oxidação, ou outro.",
      "Informe se o aparelho já foi aberto em outra assistência (Sim, Não ou Não sabe), o consumo na fonte (ex.: 0,15A travado) e o valor que o cliente já aprovou.",
      "Ao salvar, a OS entra direto na bancada de placa como \"Aguardando diagnóstico\" e a triagem fica registrada no Histórico técnico, com data e seu usuário.",
      "Na lista de OS, use o filtro \"Placa: todas\" para ver um estágio específico (encaminhado, aguardando peça, aguardando aprovação etc.) ou \"Somente bancada de placa\" para ver só esses aparelhos.",
    ],
  },
  {
    title: "Atualizar o status de uma OS",

    steps: [
      "Na lista de OS, altere o status: Aberta → Em andamento → Pronta → Entregue.",
      "Ao vender uma OS pela aba Vendas, ela é marcada como Entregue automaticamente.",
    ],
  },
  {
    title: "Bancada e problemas de placa",
    steps: [
      "Na lista de OS, clique em \"Bancada\" no aparelho. Se a OS foi aberta com triagem de placa, ela já chega aqui como \"Aguardando diagnóstico\", com a triagem no Histórico técnico.",
      "Informe onde o aparelho está (loja, em trânsito, laboratório de placa ou de volta à loja) e com quem está.",
      "Se virou problema de placa, escolha o status (encaminhado, diagnóstico, aguardando peça, aguardando cliente, em testes, concluído ou inviável).",
      "Escreva o que foi feito ou medido e clique em \"Salvar registro\". Tudo fica no Histórico técnico com data e seu usuário.",
      "Informe o valor do reparo de placa e use \"Gerar mensagem para o cliente\": a mensagem completa aparece para revisar, copiar ou abrir direto no WhatsApp do cliente. Depois marque se o cliente aprovou.",
      "Use o filtro \"Somente bancada de placa\" para ver só esses aparelhos. A etiqueta vermelha \"Parado há X dias\" mostra aparelhos sem registro há 2 dias ou mais.",
    ],

  },
  {
    title: "Dar desconto em uma venda",
    steps: [
      "Depois de adicionar os itens, informe o valor do desconto no campo \"Desconto (R$)\" ou altere o \"Total final (R$)\" para o valor combinado com o cliente.",
      "O total não pode ser maior que a soma dos itens nem zero.",
      "O desconto aplicado aparece na tela, na lista de vendas e no comprovante em PDF (Subtotal, Desconto e Total).",
    ],
  },
  {
    title: "Registrar uma venda",
    steps: [
      "O caixa da loja precisa estar aberto pelo gerente. Se não estiver, aparecerá um aviso.",
      "Na aba Vendas, adicione os itens: produto do encarte, OS ou item avulso.",
      "Escolha a forma de pagamento (Crédito, Débito, Pix ou Dinheiro) e finalize.",
      "Produtos do encarte vendidos saem do encarte automaticamente.",
      "Gere o comprovante em PDF se o cliente pedir.",
    ],
  },
  {
    title: "Consultar minhas vendas",
    steps: [
      "Na aba Vendas, use os filtros de Dia, Semana ou Mês.",
      "O cartão verde mostra o total de vendas do período.",
    ],
  },
];

const MANAGER: Topic[] = [
  {
    title: "Abrir o caixa do dia",
    steps: [
      "Na aba Financeiro, confira o dinheiro em espécie e informe o troco inicial.",
      "Clique em abrir caixa. Só então os vendedores conseguem registrar vendas.",
    ],
  },
  {
    title: "Registrar sangria (retirada)",
    steps: [
      "No Financeiro, com o caixa aberto, use a opção de sangria.",
      "Informe valor e motivo. Fica registrado quem retirou e quando.",
    ],
  },
  {
    title: "Fechar o caixa",
    steps: [
      "Confira os totais por forma de pagamento.",
      "Tire uma foto do relatório da maquininha e envie.",
      "Confirme o fechamento.",
    ],
  },
  {
    title: "Exportar o caixa para Excel / Sheets",
    steps: [
      "No Financeiro, clique em \"Exportar caixa (Excel / Sheets)\".",
      "O arquivo baixado abre no Excel ou pode ser importado no Google Sheets.",
    ],
  },
  {
    title: "Cancelar uma OS com justificativa",
    steps: [
      "Na lista de OS, clique em \"Cancelar\".",
      "Escolha o motivo (Preço alto, Demora, Falta de peças, etc.) e escreva uma observação.",
      "O cancelamento vai para a aba Auditoria.",
    ],
  },
  {
    title: "Auditoria",
    steps: [
      "Na aba Auditoria, consulte as OS canceladas, filtrando por loja e motivo.",
      "Use para entender por que os clientes desistem.",
    ],
  },
  {
    title: "Gerenciar a equipe",
    steps: [
      "Na aba Produtos, clique em \"Equipe\".",
      "Crie contas de vendedor informando loja, e-mail e senha (mín. 8 caracteres).",
      "Desative uma conta pela chave Ativo/Desativado quando alguém sair.",
    ],
  },
];

const GLOBAL: Topic[] = [
  {
    title: "Ver todas as lojas",
    steps: [
      "Supervisor Geral e Superadmin usam o seletor de loja em Vendas, Financeiro e OS para navegar entre as 4 unidades.",
    ],
  },
  {
    title: "Criar gerentes e supervisores",
    steps: [
      "Apenas o Superadmin pode criar Gerentes e Supervisores Gerais em \"Equipe\".",
      "Gerente precisa de loja; Supervisor tem acesso a todas.",
    ],
  },
];

function Section({ title, topics }: { title: string; topics: Topic[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 className="text-xl font-bold">{title}</h2>
      <Accordion type="multiple" className="mt-2">
        {topics.map((t) => (
          <AccordionItem key={t.title} value={t.title}>
            <AccordionTrigger>{t.title}</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                {t.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export function Docs({ role }: { role: string }) {
  const manager = role !== "member";
  const global = role === "superadmin" || role === "supervisor";
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Como usar o sistema</h1>
      <Section title="Rotina do dia a dia" topics={SELLER} />
      {manager && <Section title="Gerência: caixa, auditoria e equipe" topics={MANAGER} />}
      {global && <Section title="Supervisão geral" topics={GLOBAL} />}
    </div>
  );
}
