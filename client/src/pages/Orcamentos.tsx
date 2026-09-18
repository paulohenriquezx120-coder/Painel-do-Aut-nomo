import { FormEvent, useEffect, useState } from 'react';
import { api, Quote, QuoteItem } from '../api';
import { EmptyState, IconDoc, PageHeader } from '../components/ui';

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

const emptyItem = (): QuoteItem => ({ name: '', quantity: 1, unitPrice: 0 });

export default function Orcamentos() {
  const [issuerName, setIssuerName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [validityDays, setValidityDays] = useState(7);
  const [items, setItems] = useState<QuoteItem[]>([emptyItem()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const load = async () => {
    const res = await api.listQuotes();
    setQuotes(res.quotes);
  };

  useEffect(() => {
    load();
  }, []);

  const total = items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0);

  const updateItem = (idx: number, patch: Partial<QuoteItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setIssuerName('');
    setClientName('');
    setDescription('');
    setValidityDays(7);
    setItems([emptyItem()]);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!issuerName.trim() || !clientName.trim()) {
      setError('Preencha o nome do negócio e do cliente.');
      return;
    }
    const validItems = items.filter((it) => it.name.trim());
    if (validItems.length === 0) {
      setError('Adicione ao menos um item com nome.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.createQuote({
        issuerName,
        clientName,
        description,
        validityDays,
        items: validItems,
      });
      resetForm();
      load();
      window.open(`/api/quotes/${res.quote.id}/pdf`, '_blank');
    } catch (err: any) {
      setError(err.message || 'Não foi possível gerar o orçamento.');
    } finally {
      setSaving(false);
    }
  };

  const removeQuote = async (id: number) => {
    if (!confirm('Apagar este orçamento do histórico?')) return;
    await api.deleteQuote(id);
    load();
  };

  const convertQuote = async (q: Quote) => {
    if (!confirm(`Converter o orçamento de ${q.clientName} em venda? Isso registra as vendas e baixa o estoque.`)) return;
    try {
      const res = await api.convertQuote(q.id);
      let msg = `${res.sales} venda(s) registrada(s).`;
      if (res.unmatched.length > 0) {
        msg += `\n\nNão achei no estoque: ${res.unmatched.join(', ')}. Esses itens entraram com custo zero (o lucro deles aparece cheio). Cadastre o produto no Estoque pra o lucro ficar correto nas próximas.`;
      }
      alert(msg);
      load();
    } catch (err: any) {
      alert(err.message || 'Não foi possível converter o orçamento.');
    }
  };

  const today = new Date();
  const validUntil = new Date(today.getTime() + validityDays * 24 * 60 * 60 * 1000);

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        subtitle="Monte um orçamento e baixe em PDF na hora."
        icon={<IconDoc />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="card p-4">
          {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink/80">Seu negócio</span>
              <input
                value={issuerName}
                onChange={(e) => setIssuerName(e.target.value)}
                placeholder="Loja da Maria"
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink/80">Cliente</span>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome do cliente"
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="mb-3 block text-sm">
            <span className="mb-1 block font-medium text-ink/80">Descrição do serviço</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Ex: Instalação e manutenção de..."
              className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="mb-4 block text-sm">
            <span className="mb-1 block font-medium text-ink/80">Validade (dias)</span>
            <input
              type="number"
              min={1}
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value) || 1)}
              className="w-28 rounded-md border border-brand-200 px-3 py-2 text-sm"
            />
          </label>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-ink/80">Itens</span>
            <button type="button" onClick={addItem} className="text-xs font-medium text-brand-700 hover:underline">
              + Adicionar item
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_50px_70px_24px] gap-1.5 sm:grid-cols-[1fr_70px_90px_28px] sm:gap-2">
                <input
                  value={item.name}
                  onChange={(e) => updateItem(idx, { name: e.target.value })}
                  placeholder="Descrição do item"
                  className="min-w-0 rounded-md border border-brand-200 px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                  className="min-w-0 rounded-md border border-brand-200 px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                  className="min-w-0 rounded-md border border-brand-200 px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  className="min-w-0 rounded-md border border-brand-200 text-ink/50 hover:bg-brand-50 disabled:opacity-30"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 w-full rounded-md btn-grad px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {saving ? 'Gerando...' : 'Gerar orçamento em PDF'}
          </button>
        </form>

        <div>
          <div className="mb-2 text-xs font-medium uppercase text-ink/50">Pré-visualização</div>
          <div className="card p-6 shadow-sm">
            <div className="mb-4 border-b border-brand-100 pb-3">
              <div className="text-lg font-semibold text-brand-800">{issuerName || 'Seu negócio'}</div>
              <div className="text-xs text-ink/50">Orçamento</div>
            </div>

            <div className="mb-4 grid grid-cols-3 text-xs">
              <div>
                <div className="font-semibold uppercase text-ink/50">Cliente</div>
                <div className="mt-0.5 text-ink">{clientName || '—'}</div>
              </div>
              <div>
                <div className="font-semibold uppercase text-ink/50">Data</div>
                <div className="mt-0.5 text-ink">{fmtDate(today.toISOString())}</div>
              </div>
              <div>
                <div className="font-semibold uppercase text-ink/50">Válido até</div>
                <div className="mt-0.5 text-ink">{fmtDate(validUntil.toISOString())}</div>
              </div>
            </div>

            {description && (
              <div className="mb-4 text-xs text-ink/70">
                <div className="mb-0.5 font-semibold uppercase text-ink/50">Descrição</div>
                {description}
              </div>
            )}

            <table className="w-full text-xs">
              <thead>
                <tr className="bg-brand-700 text-left text-white">
                  <th className="px-2 py-1.5 font-semibold">Descrição</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Qtd</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Vl. unit.</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-brand-50/60' : ''}>
                    <td className="px-2 py-1.5">{it.name || '—'}</td>
                    <td className="px-2 py-1.5 text-right">{it.quantity}</td>
                    <td className="px-2 py-1.5 text-right">{fmtBRL(it.unitPrice)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtBRL(it.quantity * it.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-end border-t border-brand-100 pt-3">
              <div className="text-right">
                <div className="text-xs font-semibold uppercase text-ink/50">Total geral</div>
                <div className="text-xl font-bold text-brand-700">{fmtBRL(total)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-ink">Histórico de orçamentos</h2>
        <div className="overflow-x-auto card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-brand-100 bg-brand-50/60 text-left text-xs font-semibold uppercase text-ink/60">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} className="border-b border-brand-50 last:border-0 hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-medium text-ink">
                    {q.clientName}
                    {q.convertedAt && (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        virou venda
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{fmtDate(q.createdAt)}</td>
                  <td className="px-4 py-3">{fmtBRL(q.total)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-xs">
                      {!q.convertedAt && (
                        <button onClick={() => convertQuote(q)} className="font-medium text-brand-700 hover:underline">
                          Converter em venda
                        </button>
                      )}
                      <a
                        href={`/api/quotes/${q.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-brand-700 hover:underline"
                      >
                        Baixar PDF
                      </a>
                      <button onClick={() => removeQuote(q.id)} className="font-medium text-red-600 hover:underline">
                        Apagar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={<IconDoc />}
                      title="Nenhum orçamento gerado ainda"
                      text="Preencha o formulário acima e gere seu primeiro PDF."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
