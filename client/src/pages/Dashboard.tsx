import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, RankingItem, Sale, SalesSummary } from '../api';
import {
  IconCart,
  IconCoins,
  IconGrid,
  IconReceipt,
  IconTrend,
  IconWallet,
  PageHeader,
  StatCard,
} from '../components/ui';

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

export default function Dashboard() {
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

  useEffect(() => {
    api.listSales(period).then((res) => {
      setSales(res.sales);
      setSummary(res.summary);
      setRanking(res.ranking);
    });
  }, [period]);

  const dailyProfit = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const s of sales) byDay.set(s.saleDate, (byDay.get(s.saleDate) || 0) + s.profit);
    return Array.from(byDay, ([date, profit]) => ({ date, profit }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
  }, [sales]);
  const maxDaily = Math.max(1, ...dailyProfit.map((d) => d.profit));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Acompanhe o lucro e o desempenho do seu negócio."
        icon={<IconGrid />}
      />

      <div className="space-y-6">
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total vendido" value={fmtBRL(summary.totalSold)} icon={<IconCart />} />
              <StatCard
                label="Lucro total"
                value={fmtBRL(summary.totalProfit)}
                icon={<IconTrend />}
                tone={summary.totalProfit < 0 ? 'danger' : 'brand'}
              />
              <StatCard label="Vendas" value={summary.count} icon={<IconReceipt />} />
              <StatCard label="Ticket médio" value={fmtBRL(summary.avgTicket)} icon={<IconCoins />} />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link to="/despesas" className="block">
                <StatCard
                  label="Despesas"
                  value={fmtBRL(summary.totalExpenses)}
                  icon={<IconWallet />}
                  tone="warn"
                  hint="Clique para gerenciar"
                />
              </Link>
              <StatCard
                tone="hero"
                label="Lucro real (após despesas)"
                value={fmtBRL(summary.netProfit)}
                icon={<IconTrend />}
                hint="Lucro das vendas menos as despesas"
              />
            </div>
          </div>

          {dailyProfit.length > 0 && (
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Lucro por dia</h3>
                <span className="text-xs text-ink/50">últimos {dailyProfit.length} dia(s) com vendas</span>
              </div>
              <div className="flex h-36 items-end gap-2">
                {dailyProfit.map((d) => {
                  const h = Math.max(6, (Math.max(d.profit, 0) / maxDaily) * 100);
                  return (
                    <div key={d.date} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                      <div className="mb-1 hidden text-[10px] font-medium text-ink/60 group-hover:block">
                        {fmtBRL(d.profit)}
                      </div>
                      <div
                        style={{ height: `${h}%` }}
                        className={`w-full max-w-[44px] rounded-t-md ${
                          d.profit < 0 ? 'bg-red-300' : 'bg-gradient-to-t from-brand-600 to-brand-400'
                        }`}
                      />
                      <div className="mt-1.5 text-[10px] text-ink/50">{fmtDate(d.date).slice(0, 5)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {ranking.length > 0 && (
            <div className="card p-4">
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


      </div>
    </div>
  );
}
