import { NavLink } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../AuthContext';
import FeedbackWidget from './FeedbackWidget';
import { IconBox, IconDoc, IconGrid, IconSales, IconWallet } from './ui';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: IconGrid },
  { to: '/vendas', label: 'Vendas', icon: IconSales },
  { to: '/estoque', label: 'Estoque', icon: IconBox },
  { to: '/orcamentos', label: 'Orçamentos', icon: IconDoc },
  { to: '/despesas', label: 'Despesas', icon: IconWallet },
];

function trialLabel(trialEndsAt?: string | null) {
  if (!trialEndsAt) return 'Assinatura';
  const days = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  return `Teste grátis: ${days} dia(s) restante(s)`;
}

function initials(name?: string) {
  const parts = (name || '?').trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('') || '?';
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const active = user?.subscription.status === 'active';

  return (
    <div className="page-bg flex min-h-screen flex-col bg-[#f5f7f6] md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-brand-100 bg-white/90 backdrop-blur md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-2 px-4 py-4 md:px-5 md:py-5">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="" className="h-9 w-9 shrink-0 rounded-lg shadow-sm" />
            <span className="text-base font-semibold tracking-tight text-brand-800">Painel do Autônomo</span>
          </div>
          <button
            onClick={() => logout()}
            className="rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 md:hidden"
          >
            Sair
          </button>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-brand-100 px-3 py-2 md:flex-1 md:flex-col md:space-y-1 md:border-t-0 md:py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'btn-grad text-white'
                    : 'text-ink/70 hover:bg-brand-50 hover:text-brand-800'
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/assinatura"
            className={({ isActive }) =>
              `flex shrink-0 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors md:hidden ${
                isActive ? 'btn-grad text-white' : 'text-ink/70 hover:bg-brand-50 hover:text-brand-800'
              }`
            }
          >
            Assinatura
          </NavLink>
        </nav>

        <div className="hidden border-t border-brand-100 p-4 md:block">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
              {initials(user?.businessName)}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink">{user?.businessName}</div>
              <div className="truncate text-xs text-ink/50">{user?.email}</div>
            </div>
          </div>
          <NavLink
            to="/assinatura"
            className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              active ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-brand-500' : 'bg-amber-500'}`} />
            {active ? 'Assinatura ativa' : trialLabel(user?.subscription.trialEndsAt)}
          </NavLink>
          <button
            onClick={() => logout()}
            className="block w-full rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">{children}</div>
      </main>

      <FeedbackWidget />
    </div>
  );
}
