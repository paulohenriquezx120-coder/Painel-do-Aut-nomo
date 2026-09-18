import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, Product, Sale } from '../api';
import { EmptyState, IconInbox, IconSales, PageHeader } from '../components/ui';

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
      <PageHeader
        title="Vendas"
        subtitle="Registre vendas e veja o histórico. O lucro fica no Dashboard."
        icon={<IconSales />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={onSubmit} className="h-fit card p-4 lg:col-span-1">
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
            className="w-full rounded-md btn-grad px-3 py-2 text-sm font-medium text-white hover:bg-brand-800"
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
                      ? 'btn-grad text-white'
                      : 'border border-brand-200 bg-white text-ink/70 hover:bg-brand-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

          </div>

          <div className="overflow-x-auto card">
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
                  <tr key={s.id} className="border-b border-brand-50 last:border-0 hover:bg-brand-50/40">
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
                    <td colSpan={6}>
                      <EmptyState
                        icon={<IconInbox />}
                        title="Nenhuma venda neste período"
                        text="Registre sua primeira venda no formulário ao lado."
                      />
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
