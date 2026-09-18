import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Product, RankingItem, Sale, SalesSummary } from '../api';

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

const periods = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'all', label: 'Tudo' },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  productId: '',
  productName: '',
  quantity: '1',
  purchasePrice: '',
  salePrice: '',
  saleDate: todayISO(),
};

export default function Vendas() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SalesSummary>({
    totalSold: 0,
    totalProfit: 0,
    count: 0,
    avgTicket: 0,
    totalExpenses: 0,
    netProfit: 0,
  });
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [period, setPeriod] = useState('30d');
  const [form, setForm] = useState(emptyForm);
  const [useFreeText, setUseFreeText] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    const res = await api.listProducts();
    setProducts(res.products);
  };

  const loadSales = async (p = period) => {
    const res = await api.listSales(p);
    setSales(res.sales);
    setSummary(res.summary);
    setRanking(res.ranking);
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSales(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === form.productId),
    [products, form.productId]
  );

  const onSelectProduct = (id: string) => {
    const product = products.find((p) => String(p.id) === id);
    setForm({
      ...form,
      productId: id,
      productName: product?.name || '',
      purchasePrice: product ? String(product.purchasePrice) : form.purchasePrice,
      salePrice: product ? String(product.salePrice) : form.salePrice,
    });
  };

  const qty = Number(form.quantity) || 0;
  const pPrice = Number(form.purchasePrice) || 0;
  const sPrice = Number(form.salePrice) || 0;
  const previewTotal = qty * sPrice;
  const previewProfit = qty * (sPrice - pPrice);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const name = useFreeText ? form.productName : selectedProduct?.name || form.productName;
    if (!name.trim()) {
      setError('Selecione ou digite o produto vendido.');
      return;
    }
    if (qty <= 0) {
      setError('Informe uma quantidade válida.');
      return;
    }
    try {
      await api.createSale({
        productId: useFreeText ? null : selectedProduct?.id ?? null,
        productName: name,
        quantity: qty,
        purchasePrice: pPrice,
        salePrice: sPrice,
        saleDate: form.saleDate,
      });
      setForm({ ...emptyForm, saleDate: form.saleDate });
      loadSales();
      loadProducts();
    } catch (err: any) {
      setError(err.message || 'Não foi possível registrar a venda.');
    }
  };

  const removeSale = async (id: number) => {
    if (!confirm('Apagar esta venda? O estoque não será revertido.')) return;
    await api.deleteSale(id);
    loadSales();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Vendas</h1>
        <p className="text-sm text-ink/60">Registre vendas e acompanhe seu lucro.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={onSubmit} className="h-fit rounded-lg border border-brand-100 bg-white p-4 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold text-ink">Registrar venda</h2>
          {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-ink/80">Produto</span>
            <button
              type="button"
              onClick={() => setUseFreeText((v) => !v)}
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              {useFreeText ? 'Escolher do estoque' : 'Digitar nome livre'}
            </button>
          </div>

          {useFreeText ? (
            <input
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              placeholder="Nome do produto ou serviço"
              className="mb-3 w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
            />
          ) : (
            <select
              value={form.productId}
              onChange={(e) => onSelectProduct(e.target.value)}
              className="mb-3 w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
            >
              <option value="">Selecione um produto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.quantity} em estoque)
                </option>
              ))}
            </select>
          )}

          <div className="mb-3 grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink/80">Quantidade</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink/80">Data</span>
              <input
                type="date"
                value={form.saleDate}
                onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink/80">Preço de compra</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink/80">Preço de venda</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mb-4 rounded-md bg-brand-50 px-3 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/60">Total da venda</span>
              <span className="font-semibold text-ink">{fmtBRL(previewTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Lucro</span>
              <span className={`font-semibold ${previewProfit < 0 ? 'text-red-600' : 'text-brand-700'}`}>
                {fmtBRL(previewProfit)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            Registrar venda
          </button>
        </form>

        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    period === p.value
                      ? 'bg-brand-700 text-white'
                      : 'border border-brand-200 bg-white text-ink/70 hover:bg-brand-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-brand-100 bg-white p-3">
                <div className="text-xs font-medium uppercase text-ink/50">Total vendido</div>
                <div className="mt-1 text-lg font-semibold text-ink">{fmtBRL(summary.totalSold)}</div>
              </div>
              <div className="rounded-lg border border-brand-100 bg-white p-3">
                <div className="text-xs font-medium uppercase text-ink/50">Lucro total</div>
                <div className={`mt-1 text-lg font-semibold ${summary.totalProfit < 0 ? 'text-red-600' : 'text-brand-700'}`}>
                  {fmtBRL(summary.totalProfit)}
                </div>
              </div>
              <div className="rounded-lg border border-brand-100 bg-white p-3">
                <div className="text-xs font-medium uppercase text-ink/50">Vendas</div>
                <div className="mt-1 text-lg font-semibold text-ink">{summary.count}</div>
              </div>
              <div className="rounded-lg border border-brand-100 bg-white p-3">
                <div className="text-xs font-medium uppercase text-ink/50">Ticket médio</div>
                <div className="mt-1 text-lg font-semibold text-ink">{fmtBRL(summary.avgTicket)}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link to="/despesas" className="rounded-lg border border-brand-100 bg-white p-3 hover:bg-brand-50/50">
                <div className="text-xs font-medium uppercase text-ink/50">Despesas</div>
                <div className="mt-1 text-lg font-semibold text-ink">{fmtBRL(summary.totalExpenses)}</div>
              </Link>
              <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-3">
                <div className="text-xs font-medium uppercase text-ink/50">Lucro real (após despesas)</div>
                <div className={`mt-1 text-lg font-semibold ${summary.netProfit < 0 ? 'text-red-600' : 'text-brand-700'}`}>
                  {fmtBRL(summary.netProfit)}
                </div>
              </div>
            </div>
          </div>

          {ranking.length > 0 && (
            <div className="rounded-lg border border-brand-100 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">Mais vendidos no período</h3>
              <div className="space-y-2">
                {ranking.slice(0, 5).map((r, idx) => (
                  <div key={r.productName} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                        {idx + 1}
                      </span>
                      <span className="text-ink">{r.productName}</span>
                      <span className="text-xs text-ink/50">{r.quantity} un.</span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-ink/60">Faturou {fmtBRL(r.revenue)}</span>
                      <span className={r.profit < 0 ? 'text-red-600' : 'text-brand-700'}>
                        Lucro {fmtBRL(r.profit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-brand-100 bg-white">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-brand-100 bg-brand-50/60 text-left text-xs font-semibold uppercase text-ink/60">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Qtd</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Lucro</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="border-b border-brand-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{s.productName}</td>
                    <td className="px-4 py-3 text-ink/70">{fmtDate(s.saleDate)}</td>
                    <td className="px-4 py-3">{s.quantity}</td>
                    <td className="px-4 py-3">{fmtBRL(s.total)}</td>
                    <td className={`px-4 py-3 font-medium ${s.profit < 0 ? 'text-red-600' : 'text-brand-700'}`}>
                      {fmtBRL(s.profit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeSale(s.id)} className="text-xs font-medium text-red-600 hover:underline">
                        Apagar
                      </button>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink/50">
                      Nenhuma venda registrada neste período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
