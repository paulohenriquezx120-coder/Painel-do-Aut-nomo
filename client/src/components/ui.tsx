import { ReactNode } from 'react';

type IconProps = { className?: string };

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const IconSales = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 19V9M12 19V4M20 19v-6" />
  </svg>
);
export const IconGrid = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);
export const IconBox = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M21 8L12 3 3 8v8l9 5 9-5V8z" />
    <path d="M3 8l9 5 9-5M12 13v8" />
  </svg>
);
export const IconDoc = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
);
export const IconWallet = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 7a2 2 0 0 1 2-2h13v4" />
    <path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2z" />
    <circle cx="16" cy="14.5" r="1" />
  </svg>
);
export const IconTrend = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </svg>
);
export const IconCoins = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="9" cy="9" r="6" />
    <path d="M15.5 8.5A6 6 0 1 1 8.5 15.5" />
  </svg>
);
export const IconAlert = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 3l10 18H2L12 3z" />
    <path d="M12 10v5M12 18h.01" />
  </svg>
);
export const IconCart = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20 8H6" />
    <circle cx="9" cy="20" r="1" />
    <circle cx="17" cy="20" r="1" />
  </svg>
);
export const IconReceipt = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);
export const IconInbox = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" />
    <path d="M3 13h5l1 3h6l1-3h5" />
  </svg>
);

type Tone = 'default' | 'brand' | 'warn' | 'danger' | 'hero';

const chipTone: Record<Exclude<Tone, 'hero'>, string> = {
  default: 'bg-brand-50 text-brand-600',
  brand: 'bg-brand-100 text-brand-700',
  warn: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-600',
};

export function StatCard({
  label,
  value,
  icon,
  tone = 'default',
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: Tone;
  hint?: string;
}) {
  if (tone === 'hero') {
    return (
      <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white shadow-md shadow-brand-900/20">
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-white/75">{label}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">{icon}</span>
        </div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint && <div className="mt-1 text-xs text-white/70">{hint}</div>}
      </div>
    );
  }
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${chipTone[tone]}`}>{icon}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink/50">{hint}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-900/20">
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-ink/60">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        {icon}
      </span>
      <div className="text-sm font-medium text-ink">{title}</div>
      {text && <div className="mt-1 max-w-xs text-xs text-ink/50">{text}</div>}
    </div>
  );
}
