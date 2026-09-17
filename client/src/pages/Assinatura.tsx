import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError, Plan } from '../api';
import { useAuth } from '../AuthContext';

function fmtBRL(cents: number, currency: string) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: currency.toUpperCase() });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

function planIntervalLabel(plan: Plan) {
  if (plan.interval === 'month' && plan.intervalCount === 3) return '/ trimestre';
  if (plan.interval === 'month' && plan.intervalCount === 1) return '/ mês';
  return `/ ${plan.intervalCount} ${plan.interval}(es)`;
}

export default function Assinatura() {
  const { user, refresh, logout } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [error, setError] = useState('');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [waitingPayment, setWaitingPayment] = useState(false);

  useEffect(() => {
    api
      .getPlans()
      .then((res) => setPlans(res.plans))
      .catch(() => setPlans([]));
  }, []);

  const subscription = user?.subscription;
  const trialActive =
    subscription?.status === 'trialing' && subscription.trialEndsAt && new Date(subscription.trialEndsAt) > new Date();

  const subscribe = async (e: FormEvent, planId: string) => {
    e.preventDefault();
    setError('');
    const digits = cpfCnpj.replace(/\D/g, '');
    if (digits.length !== 11 && digits.length !== 14) {
      setError('Informe um CPF ou CNPJ válido.');
      return;
    }
    setLoadingPlan(planId);
    try {
      const res = await api.subscribe({ planId, cpfCnpj: digits });
      setWaitingPayment(true);
      window.open(res.invoiceUrl, '_blank', 'noopener');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível iniciar a assinatura.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const cancel = async () => {
    if (!confirm('Cancelar sua assinatura?')) return;
    setError('');
    setCanceling(true);
    try {
      await api.cancelSubscription();
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível cancelar a assinatura.');
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-xl font-semibold text-ink">Assinatura</h1>
      <p className="mb-6 text-sm text-ink/60">Gerencie o acesso ao Painel do Autônomo.</p>

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="rounded-lg border border-brand-100 bg-white p-6">
        {subscription?.status === 'active' && (
          <>
            <div className="mb-1 text-sm font-medium text-brand-700">Assinatura ativa</div>
            {subscription.currentPeriodEnd && (
              <p className="mb-4 text-sm text-ink/60">
                Renova em {fmtDate(subscription.currentPeriodEnd)}.
              </p>
            )}
            <button
              onClick={cancel}
              disabled={canceling}
              className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {canceling ? 'Cancelando...' : 'Cancelar assinatura'}
            </button>
          </>
        )}

        {trialActive && (
          <>
            <div className="mb-1 text-sm font-medium text-ink">Você está no período de teste grátis</div>
            <p className="mb-4 text-sm text-ink/60">
              Seu teste termina em {fmtDate(subscription!.trialEndsAt as string)}. Assine para não perder o acesso.
            </p>
          </>
        )}

        {!trialActive && subscription?.status !== 'active' && (
          <>
            <div className="mb-1 text-sm font-medium text-ink">Assine para começar a usar</div>
            <p className="mb-4 text-sm text-ink/60">Escolha um plano para acessar o estoque, vendas e orçamentos.</p>
          </>
        )}

        {subscription?.status !== 'active' && (
          <>
            <label className="mb-4 block text-sm">
              <span className="mb-1 block font-medium text-ink/80">CPF ou CNPJ</span>
              <input
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="Necessário para gerar a cobrança"
              />
            </label>

            {waitingPayment && (
              <div className="mb-4 rounded-md bg-brand-50 px-3 py-2 text-sm text-ink">
                Abrimos a página de pagamento em outra aba. Depois de pagar, seu acesso libera automaticamente em
                alguns instantes —{' '}
                <button onClick={() => refresh()} className="font-medium text-brand-700 hover:underline">
                  clique aqui para verificar
                </button>
                .
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {plans.length === 0 && (
                <div className="col-span-1 rounded-md bg-brand-50 p-4 text-sm text-ink/50 sm:col-span-2">
                  Nenhum plano configurado pelo administrador ainda.
                </div>
              )}
              {plans.map((p) => (
                <div key={p.id} className="rounded-md bg-brand-50 p-4">
                  <div className="mb-1 text-xs font-semibold uppercase text-ink/50">{p.label}</div>
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-brand-800">{fmtBRL(p.amount, p.currency)}</span>
                    <span className="text-sm text-ink/60"> {planIntervalLabel(p)}</span>
                  </div>
                  <button
                    onClick={(e) => subscribe(e, p.id)}
                    disabled={loadingPlan !== null}
                    className="block w-full rounded-md bg-brand-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
                  >
                    {loadingPlan === p.id ? 'Gerando...' : 'Assinar'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <button onClick={() => logout()} className="mt-4 text-sm text-ink/50 hover:underline">
        Sair
      </button>
    </div>
  );
}
