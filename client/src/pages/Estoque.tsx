import { FormEvent, useEffect, useState } from 'react';
import { api, Product, ProductSummary } from '../api';

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const emptyForm = { name: '', sku: '', quantity: '', minQuantity: '', purchasePrice: '', salePrice: '' };

export default function Estoque() {
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<ProductSummary>({ total: 0, lowStock: 0, totalUnits: 0 });
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Record<keyof Product, string>>>({});
  const [error, setError] = useState('');

  const load = async (q = query) => {
    const res = await api.listProducts(q);
    setProducts(res.products);
    setSummary(res.summary);
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(query), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Informe o nome do produto.');
      return;
    }
    try {
      await api.createProduct({
        name: form.name,
        sku: form.sku,
        quantity: Number(form.quantity) || 0,
        minQuantity: Number(form.minQuantity) || 0,
        purchasePrice: Number(form.purchasePrice) || 0,
        salePrice: Number(form.salePrice) || 0,
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.message || 'Não foi possível cadastrar o produto.');
    }
  };

  const adjustQty = async (product: Product, delta: number) => {
    await api.adjustQuantity(product.id, delta);
    load();
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditDraft({
      name: product.name,
      sku: product.sku,
      minQuantity: String(product.minQuantity),
      purchasePrice: String(product.purchasePrice),
      salePrice: String(product.salePrice),
    });
  };

  const saveEdit = async (id: number) => {
    await api.updateProduct(id, {
      name: editDraft.name as string,
      sku: editDraft.sku as string,
      minQuantity: Number(editDraft.minQuantity),
      purchasePrice: Number(editDraft.purchasePrice),
      salePrice: Number(editDraft.salePrice),
    } as any);
    setEditingId(null);
    load();
  };

  const removeProduct = async (id: number) => {
    if (!confirm('Apagar este produto do estoque?')) return;
    await api.deleteProduct(id);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Estoque</h1>
          <p className="text-sm text-ink/60">Controle seus produtos e quantidades.</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/products/export.csv"
            className="rounded-md border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            Exportar CSV
          </a>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            {showForm ? 'Cancelar' : '+ Novo produto'}
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-brand-100 bg-white p-4">
          <div className="text-xs font-medium uppercase text-ink/50">Produtos cadastrados</div>
          <div className="mt-1 text-2xl font-semibold text-ink">{summary.total}</div>
        </div>
        <div className="rounded-lg border border-brand-100 bg-white p-4">
          <div className="text-xs font-medium uppercase text-ink/50">Estoque baixo</div>
          <div className={`mt-1 text-2xl font-semibold ${summary.lowStock > 0 ? 'text-amber-600' : 'text-ink'}`}>
            {summary.lowStock}
          </div>
        </div>
        <div className="rounded-lg border border-brand-100 bg-white p-4">
          <div className="text-xs font-medium uppercase text-ink/50">Total de unidades</div>
          <div className="mt-1 text-2xl font-semibold text-ink">{summary.totalUnits}</div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={onCreate} className="mb-6 rounded-lg border border-brand-100 bg-white p-4">
          {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink/80">Nome*</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink/80">SKU</span>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink/80">Quantidade em estoque</span>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink/80">Estoque mínimo</span>
              <input
                type="number"
                value={form.minQuantity}
                onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink/80">Preço de compra</span>
              <input
                type="number"
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
                step="0.01"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            Salvar produto
          </button>
        </form>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nome ou SKU..."
        className="mb-4 w-full max-w-sm rounded-md border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      />

      <div className="overflow-hidden rounded-lg border border-brand-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-100 bg-brand-50/60 text-left text-xs font-semibold uppercase text-ink/60">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Quantidade</th>
              <th className="px-4 py-3">Mínimo</th>
              <th className="px-4 py-3">Preço compra</th>
              <th className="px-4 py-3">Preço venda</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isEditing = editingId === p.id;
              return (
                <tr key={p.id} className="border-b border-brand-50 last:border-0">
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        value={editDraft.name as string}
                        onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                        className="w-full rounded border border-brand-200 px-2 py-1"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{p.name}</span>
                        {p.outOfStock ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            esgotado
                          </span>
                        ) : p.lowStock ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            estoque baixo
                          </span>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {isEditing ? (
                      <input
                        value={editDraft.sku as string}
                        onChange={(e) => setEditDraft({ ...editDraft, sku: e.target.value })}
                        className="w-full rounded border border-brand-200 px-2 py-1"
                      />
                    ) : (
                      p.sku || '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustQty(p, -1)}
                        className="h-6 w-6 rounded border border-brand-200 text-ink/70 hover:bg-brand-50"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium">{p.quantity}</span>
                      <button
                        onClick={() => adjustQty(p, 1)}
                        className="h-6 w-6 rounded border border-brand-200 text-ink/70 hover:bg-brand-50"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editDraft.minQuantity as string}
                        onChange={(e) => setEditDraft({ ...editDraft, minQuantity: e.target.value })}
                        className="w-20 rounded border border-brand-200 px-2 py-1"
                      />
                    ) : (
                      p.minQuantity
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editDraft.purchasePrice as string}
                        onChange={(e) => setEditDraft({ ...editDraft, purchasePrice: e.target.value })}
                        className="w-24 rounded border border-brand-200 px-2 py-1"
                      />
                    ) : (
                      fmtBRL(p.purchasePrice)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editDraft.salePrice as string}
                        onChange={(e) => setEditDraft({ ...editDraft, salePrice: e.target.value })}
                        className="w-24 rounded border border-brand-200 px-2 py-1"
                      />
                    ) : (
                      fmtBRL(p.salePrice)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveEdit(p.id)}
                          className="rounded-md bg-brand-700 px-2 py-1 text-xs font-medium text-white hover:bg-brand-800"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-md border border-brand-200 px-2 py-1 text-xs text-ink/70"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3 text-xs">
                        <button onClick={() => startEdit(p)} className="font-medium text-brand-700 hover:underline">
                          Editar
                        </button>
                        <button onClick={() => removeProduct(p.id)} className="font-medium text-red-600 hover:underline">
                          Apagar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink/50">
                  Nenhum produto cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
