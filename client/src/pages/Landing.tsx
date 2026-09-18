import { Link } from 'react-router-dom';
import vendasKpis from '../assets/landing/vendas-kpis.png';
import vendasFeature from '../assets/landing/vendas-feature.png';
import estoqueFeature from '../assets/landing/estoque-feature.png';
import orcamentoFeature from '../assets/landing/orcamento-feature.png';

function IconOrcamento() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M7 3h10v18l-5-3-5 3V3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconEstoque() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M21 8L12 3 3 8v8l9 5 9-5V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconVendas() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 19V9M12 19V4M20 19v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Landing() {
  return (
    <div className="bg-[#f5f7f6]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-8 w-8 rounded-md" />
          <span className="text-base font-semibold text-brand-800">Painel do Autônomo</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/entrar" className="hidden text-sm font-medium text-ink/70 hover:text-ink sm:block">
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            Criar conta grátis
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-14">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h1 className="mb-5 text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
              Chega de vender <span className="text-brand-700">sem saber quanto lucra.</span>
            </h1>
            <p className="mb-8 max-w-md text-lg leading-relaxed text-ink/60">
              Orçamento, estoque e vendas num só painel — feito pra quem vende sozinho e quer ver o lucro real
              de cada venda, não só o quanto entrou na conta.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/cadastro"
                className="rounded-md bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Criar conta grátis
              </Link>
              <a
                href="#como-funciona"
                className="rounded-md border border-brand-200 bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-brand-50"
              >
                Ver como funciona
              </a>
            </div>
            <p className="mt-4 text-sm text-ink/50">A partir de R$ 39,90/mês. Cancele quando quiser.</p>
          </div>

          <div>
            <div className="overflow-hidden rounded-xl border border-brand-100 bg-white shadow-lg shadow-brand-900/5">
              <img src={vendasKpis} alt="Resumo real de vendas e lucro no Painel do Autônomo" className="w-full" />
            </div>
            <p className="mt-3 text-center text-xs text-ink/40">
              Print real da tela de Vendas de uma conta do Painel do Autônomo
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-brand-100 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-semibold leading-snug text-ink sm:text-3xl">
            A maioria de quem vende sozinho não sabe responder uma pergunta simples: quanto realmente sobrou
            esse mês?
          </h2>
          <p className="text-base leading-relaxed text-ink/60">
            Entre planilha pra estoque, bloco de notas pra orçamento e a cabeça pra lembrar dos preços, é fácil
            vender bastante e mesmo assim não saber se o negócio tá dando lucro de verdade.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="mb-3 text-2xl font-semibold text-ink sm:text-3xl">
            Tudo o que o seu negócio precisa, num lugar só
          </h2>
          <p className="text-sm text-ink/60">Três ferramentas que conversam entre si — não três apps separados.</p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-brand-100 bg-white p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <IconOrcamento />
            </div>
            <h3 className="mb-2 text-base font-semibold text-ink">Orçamentos em PDF</h3>
            <p className="mb-4 text-sm leading-relaxed text-ink/60">
              Monte um orçamento profissional em segundos e mande pro cliente já em PDF, com seus itens,
              valores e validade.
            </p>
            <img src={orcamentoFeature} alt="Orçamento real gerado em PDF pelo sistema" className="w-full rounded-lg border border-brand-100" />
          </div>

          <div className="rounded-xl border border-brand-100 bg-white p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <IconEstoque />
            </div>
            <h3 className="mb-2 text-base font-semibold text-ink">Controle de estoque</h3>
            <p className="mb-4 text-sm leading-relaxed text-ink/60">
              Saiba o que tem, o que tá acabando e evite prejuízo por vender algo que não tinha mais.
            </p>
            <img src={estoqueFeature} alt="Tela real de controle de estoque com alerta de estoque baixo" className="w-full rounded-lg border border-brand-100" />
          </div>

          <div className="rounded-xl border border-brand-100 bg-white p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <IconVendas />
            </div>
            <h3 className="mb-2 text-base font-semibold text-ink">Vendas com lucro real</h3>
            <p className="mb-4 text-sm leading-relaxed text-ink/60">
              Registra o preço de compra e de venda de cada item, e o painel calcula o lucro na hora — não só
              o faturamento.
            </p>
            <img src={vendasFeature} alt="Tela real de vendas com lucro calculado automaticamente" className="w-full rounded-lg border border-brand-100" />
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-brand-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-2xl font-semibold text-ink sm:text-3xl">Como funciona</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-semibold text-brand-700">01</p>
              <h3 className="mb-2 text-base font-semibold text-ink">Cadastre seus produtos</h3>
              <p className="text-sm leading-relaxed text-ink/60">
                Nome, quantidade e preço de compra e venda. Leva menos de um minuto por item — ou importe tudo
                de uma vez por planilha.
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-brand-700">02</p>
              <h3 className="mb-2 text-base font-semibold text-ink">Registre vendas e orçamentos</h3>
              <p className="text-sm leading-relaxed text-ink/60">
                Cada venda desconta do estoque sozinha. Cada orçamento vira PDF com um clique.
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-brand-700">03</p>
              <h3 className="mb-2 text-base font-semibold text-ink">Veja seu lucro de verdade</h3>
              <p className="text-sm leading-relaxed text-ink/60">
                Acompanhe o resultado por dia, por semana ou por produto — sem abrir planilha nenhuma.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 text-center sm:px-6">
        <h2 className="mb-3 text-2xl font-semibold text-ink sm:text-3xl">Comece a ver seu lucro hoje</h2>
        <p className="mb-7 text-sm text-ink/60">R$ 39,90/mês ou R$ 89,90/trimestre. Cancele quando quiser.</p>
        <Link
          to="/cadastro"
          className="inline-block rounded-md bg-brand-700 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Criar conta grátis
        </Link>
      </section>

      <footer className="border-t border-brand-100 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-xs text-ink/50">
          <span>© 2026 Painel do Autônomo</span>
          <span>Feito pra quem vende sozinho</span>
        </div>
      </footer>
    </div>
  );
}
