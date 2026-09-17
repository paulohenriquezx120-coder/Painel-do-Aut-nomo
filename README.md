# Painel do Autônomo

SaaS de painel para autônomos e pequenos vendedores: controle de estoque, gerador de orçamentos em PDF e painel de vendas com cálculo de lucro.

## Stack
- **Backend:** Node.js + Express + SQLite (`node:sqlite`, nativo do Node), autenticação por cookie/JWT, PDF com pdfkit, assinaturas via Stripe.
- **Frontend:** React + Vite + TypeScript + Tailwind CSS.

## Como rodar localmente

Abra dois terminais.

**Terminal 1 — backend (porta 4000):**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 — frontend (porta 5173):**
```bash
cd client
npm install
npm run dev
```

Acesse `http://localhost:5173`, crie uma conta e comece a usar. O banco de dados é um arquivo local (`server/data.sqlite`), criado automaticamente na primeira execução.

## Assinatura (Stripe)

Todo novo cadastro ganha 7 dias de teste grátis sem precisar de cartão. Depois disso, o acesso é bloqueado até assinar.

1. Copie `server/.env.example` para `server/.env`.
2. Preencha `STRIPE_SECRET_KEY` (Dashboard do Stripe > Developers > API keys) e `STRIPE_PRICE_ID` (produto/preço da assinatura).
3. Para produção, configure também `STRIPE_WEBHOOK_SECRET` (endpoint de webhook apontando para `/api/billing/webhook`).

## Estrutura
```
server/   API REST (auth, produtos, vendas, orçamentos + PDF, assinatura Stripe)
client/   Interface web (login, estoque, orçamentos, vendas, assinatura)
```

Cada usuário só enxerga seus próprios produtos, vendas e orçamentos.
