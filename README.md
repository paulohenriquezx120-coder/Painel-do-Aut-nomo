# Painel do Autônomo

SaaS de painel para autônomos e pequenos vendedores: controle de estoque, gerador de orçamentos em PDF e painel de vendas com cálculo de lucro.

Site em produção: https://painel-do-autonomo.onrender.com

## Stack
- **Backend:** Node.js + Express, banco SQLite hospedado no Turso (`@libsql/client`), autenticação por cookie/JWT, PDF com pdfkit, assinaturas via Stripe.
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

Acesse `http://localhost:5173` e crie uma conta.

## Configuração (server/.env)

Copie `server/.env.example` para `server/.env` e preencha:

- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`: banco de dados (turso.tech, plano gratuito). Sem isso o servidor não sobe.
- `ADMIN_EMAILS`: e-mails com acesso liberado sem precisar assinar.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`: confirmação automática de pagamento (opcional no começo — o checkout funciona via Payment Link mesmo sem isso).
- `STRIPE_PLAN_*`: valores e links dos planos exibidos na tela de assinatura.

## Assinatura (Stripe)

Não há teste grátis (`TRIAL_DAYS=0`) — o acesso é liberado só por assinatura ativa ou por estar em `ADMIN_EMAILS`.

## Estrutura
```
server/   API REST (auth, produtos, vendas, orçamentos + PDF, assinatura Stripe)
client/   Interface web (login, estoque, orçamentos, vendas, assinatura)
```

Cada usuário só enxerga seus próprios produtos, vendas e orçamentos.
