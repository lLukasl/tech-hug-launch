# Cell Clinic Landing

Crie uma Landing Page moderna, de alta conversão e totalmente responsiva para a "Clínica Cell", uma assistência técnica especializada em conserto de smartphones. 

### 1. Identidade Visual e Conceito:

- O logotipo atual é um celular andando de muletas. Mantenha essa essência bem-humorada e profissional, mas dê um ar moderno, limpo e "tech" para a página.

- Use uma paleta de cores que transmita confiança e agilidade (ex: tons de azul tech, cinza escuro e um tom vibrante para os botões de ação/CTA, como verde ou laranja).

- Design limpo, com bastante espaço em branco, tipografia legível e ícones modernos.

### 2. Estrutura da Página (Seções com IDs para Sitelinks):

Para podermos usar links internos como Sitelinks no Google Ads, a página deve ser uma One-Page estruturada com IDs específicos (`href="#id"`). Crie as seguintes seções:

- `#inicio` (Hero Section): Frase de impacto clara. Ex: "Seu smartphone quebrado tem conserto rápido e seguro." Botão de CTA principal.

- `#servicos` (Nossos Serviços): Lista de soluções comuns de forma técnica e clara (Troca de tela, substituição de bateria, reparo de placa, problemas de carga). *Nota: Evite promessas de "cura/milagre" para alinhar com o Google Ads.*

- `#unidades` (Onde Estamos / Lojas): Seção crucial que lista as lojas físicas disponíveis. Cada loja deve ter seu próprio card com endereço e um botão de CTA exclusivo.

- `#como-funciona` (Processo): Passo a passo simples (1. Traga seu aparelho ou solicite orçamento online / 2. Diagnóstico técnico / 3. Reparo rápido com garantia).

- `#contato` (Fale Conosco): Rodapé com informações de contato, horários de funcionamento, CNPJ e links de políticas de privacidade.

### 3. Sistema de Call to Action (CTA) por Loja (WhatsApp Dinâmico):

- No topo (Header) e na seção `#inicio`, o botão principal deve abrir um modal/popup amigável perguntando: "Qual unidade está mais próxima de você?" para direcionar ao WhatsApp correto.

- Na seção `#unidades`, cada loja deve ter seu botão "Fale com a Unidade [Nome da Loja]" apontando diretamente para o link do WhatsApp específico daquela filial (use placeholders de links como `https://wa.me/seu-numero-loja1`, etc., para eu alterar depois).

### 4. Diretrizes de Texto para Google Ads (Compliance):

- O texto deve ser estritamente comercial e focado em prestação de serviços técnicos. 

- NÃO use palavras ou promessas exageradas que ativem o bot de reprovação do Google (evite termos como "conserto garantido em 5 minutos", "o mais barato do Brasil", ou promessas absolutas). 

- Use termos focados em "Assistência Técnica Especializada", "Orçamento Transparente", "Profissionais Qualificados" e "Peças de Alta Qualidade".

- No rodapé, inclua de forma visível os termos obrigatórios para o Google Ads: Nome da Empresa, CNPJ, Endereço da matriz e um link placeholder para "Políticas de Privacidade".

### 5. Requisitos Técnicos:

- Código limpo, semântico e focado em SEO/Performance de carregamento.

- Navegação suave (smooth scroll) ao clicar nos links do menu que apontam para as seções de Sitelinks (`#servicos`, `#unidades`, etc.).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tech-hug-launch.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5926e199-a2a8-40af-a4c0-ee7b38bd1af9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
