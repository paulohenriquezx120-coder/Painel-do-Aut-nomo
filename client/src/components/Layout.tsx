import { NavLink } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../AuthContext';

const navItems = [
  { to: '/vendas', label: 'Vendas' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/orcamentos', label: 'Orçamentos' },
];

function trialLabel(trialEndsAt?: string | null) {
  if (!trialEndsAt) return 'Assinatura';
  const days = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  return `Teste grátis: ${days} dia(s) restante(s)`;
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f6] md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-brand-100 bg-white md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-2 px-4 py-4 md:border-b md:border-brand-100 md:px-5 md:py-5">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="h-8 w-8 shrink-0 rounded-md" />
            <span className="text-base font-semibold text-brand-800">Painel do Autônomo</span>
          </div>
          <button
            onClick={() => logout()}
            className="rounded-md border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 md:hidden"
          >
            Sair
          </button>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-brand-100 px-3 py-2 md:flex-1 md:flex-col md:space-y-1 md:border-t-0 md:py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors md:block ${
                  isActive
                    ? 'bg-brand-700 text-white'
                    : 'text-ink/70 hover:bg-brand-50 hover:text-brand-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/assinatura"
            className={({ isActive }) =>
              `shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors md:hidden ${
                isActive ? 'bg-brand-700 text-white' : 'text-ink/70 hover:bg-brand-50 hover:text-brand-800'
              }`
            }
          >
            Assinatura
          </NavLink>
        </nav>

        <div className="hidden border-t border-brand-100 px-4 py-4 md:block">
          <div className="mb-2 truncate text-sm font-medium text-ink">{user?.businessName}</div>
          <div className="mb-3 truncate text-xs text-ink/50">{user?.email}</div>
          <NavLink
            to="/assinatura"
            className="mb-2 block text-xs font-medium text-brand-700 hover:underline"
          >
            {user?.subscription.status === 'active' ? 'Assinatura ativa' : trialLabel(user?.subscription.trialEndsAt)}
          </NavLink>
          <button
            onClick={() => logout()}
            className="w-full rounded-md border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">{children}</div>
      </main>
    </div>
  );
}
