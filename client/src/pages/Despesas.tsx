import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError, Expense } from '../api';

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

export default function Despesas() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [period, setPeriod] = useState('30d');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayISO());
  const [error, setError] = useState('');

  const load = async (p = period) => {
    const res = await api.listExpenses(p);
    setExpenses(res.expenses);
    setTotal(res.total);
  };

  useEffect(() => {
    load(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.createExpense({ description, amount: Number(amount), expenseDate });
      setDescription('');
      setAmount('');
      setExpenseDate(todayISO());
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar a despesa.');
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Apagar esta despesa?')) return;
    await api.deleteExpense(id);
    load();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Despesas</h1>
        <p className="text-sm text-ink/60">
          Registre aluguel, frete, taxas e outros custos pra ver o lucro real na tela de Vendas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={onSubmit} className="h-fit rounded-lg border border-brand-100 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Nova despesa</h2>
          {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <label className="mb-3 block text-sm">
            <span className="mb-1 block font-medium text-ink/80">Descrição</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Frete, aluguel, embalagens"
              className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <label className="min-w-0 text-sm">
              <span className="mb-1 block font-medium text-ink/80">Valor</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full min-w-0 rounded-md border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="min-w-0 text-sm">
              <span className="mb-1 block font-medium text-ink/80">Data</span>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full min-w-0 rounded-md border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            Salvar despesa
          </button>
        </form>

        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
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

          <div className="rounded-lg border border-brand-100 bg-white p-4">
            <div className="text-xs font-medium uppercase text-ink/50">Total de despesas no período</div>
            <div className="mt-1 text-2xl font-semibold text-ink">{fmtBRL(total)}</div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-brand-100 bg-white">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-brand-100 bg-brand-50/60 text-left text-xs font-semibold uppercase text-ink/60">
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-brand-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{e.description}</td>
                    <td className="px-4 py-3 text-ink/70">{fmtDate(e.expenseDate)}</td>
                    <td className="px-4 py-3">{fmtBRL(e.amount)}</td>
                    <td className="px-4 py-3 text-right text-xs">
                      <button onClick={() => remove(e.id)} className="font-medium text-red-600 hover:underline">
                        Apagar
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink/50">
                      Nenhuma despesa registrada neste período.
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
