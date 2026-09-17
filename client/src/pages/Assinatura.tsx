import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, Plan } from '../api';
import { useAuth } from '../AuthContext';

function fmtBRL(cents: number, currency: string) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: currency.toUpperCase() });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

function planCheckoutUrl(plan: Plan, userId: number, email: string) {
  const url = new URL(plan.paymentLinkUrl);
  url.searchParams.set('client_reference_id', String(userId));
  url.searchParams.set('prefilled_email', email);
  return url.toString();
}

function planIntervalLabel(plan: Plan) {
  if (plan.interval === 'month' && plan.intervalCount === 3) return '/ trimestre';
  if (plan.interval === 'month' && plan.intervalCount === 1) return '/ mês';
  return `/ ${plan.intervalCount} ${plan.interval}(es)`;
}

export default function Assinatura() {
  const { user, refresh, logout } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [params] = useSearchParams();

  useEffect(() => {
    api
      .getPlans()
      .then((res) => setPlans(res.plans))
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    const sessionId = params.get('session_id');
    if (params.get('success') && sessionId) {
      api.verifyCheckoutSession(sessionId).finally(() => refresh());
    } else if (params.get('success')) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscription = user?.subscription;
  const trialActive =
    subscription?.status === 'trialing' && subscription.trialEndsAt && new Date(subscription.trialEndsAt) > new Date();

  const openPortal = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.createPortalSession();
      window.location.href = res.url;
    } catch (err: any) {
      setError(err.message || 'Não foi possível abrir o portal.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-xl font-semibold text-ink">Assinatura</h1>
      <p className="mb-6 text-sm text-ink/60">Gerencie o acesso ao Painel do Autônomo.</p>

      {params.get('canceled') && (
        <div className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Checkout cancelado. Você pode tentar novamente quando quiser.
        </div>
      )}
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
              onClick={openPortal}
              disabled={loading}
              className="rounded-md border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-60"
            >
              Gerenciar assinatura
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
            <div className="mb-1 text-sm font-medium text-red-600">Seu teste grátis acabou</div>
            <p className="mb-4 text-sm text-ink/60">Assine para continuar usando o estoque, vendas e orçamentos.</p>
          </>
        )}

        {subscription?.status !== 'active' && (
          <div className="mt-2 grid grid-cols-2 gap-3">
            {plans.length === 0 && (
              <div className="col-span-2 rounded-md bg-brand-50 p-4 text-sm text-ink/50">
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
                <a
                  href={user ? planCheckoutUrl(p, user.id, user.email) : undefined}
                  aria-disabled={!user}
                  className="block w-full rounded-md bg-brand-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-800"
                >
                  Assinar
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => logout()} className="mt-4 text-sm text-ink/50 hover:underline">
        Sair
      </button>
    </div>
  );
}
