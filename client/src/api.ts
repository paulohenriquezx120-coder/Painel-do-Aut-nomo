export type Product = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  purchasePrice: number;
  salePrice: number;
  lowStock: boolean;
  outOfStock: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductSummary = { total: number; lowStock: number; totalUnits: number };

export type Sale = {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  total: number;
  profit: number;
  saleDate: string;
  createdAt: string;
};

export type SalesSummary = { totalSold: number; totalProfit: number; count: number; avgTicket: number };
export type RankingItem = { productName: string; quantity: number; revenue: number; profit: number };

export type QuoteItem = { name: string; quantity: number; unitPrice: number };

export type Quote = {
  id: number;
  issuerName: string;
  clientName: string;
  description: string;
  validityDays: number;
  items: QuoteItem[];
  total: number;
  createdAt: string;
};

export type Subscription = {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  hasAccess: boolean;
};

export type User = {
  id: number;
  name: string;
  businessName: string;
  email: string;
  subscription: Subscription;
};

export type Plan = {
  id: string;
  label: string;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  paymentLinkUrl: string;
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = 'Algo deu errado.';
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      // ignore
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  register: (payload: { name: string; businessName: string; email: string; password: string }) =>
    request<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) =>
    request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: User }>('/auth/me'),

  listProducts: (q = '') =>
    request<{ products: Product[]; summary: ProductSummary }>(
      `/products${q ? `?q=${encodeURIComponent(q)}` : ''}`
    ),
  createProduct: (payload: Partial<Product>) =>
    request<{ product: Product }>('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id: number, payload: Partial<Product>) =>
    request<{ product: Product }>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  adjustQuantity: (id: number, delta: number) =>
    request<{ product: Product }>(`/products/${id}/quantity`, {
      method: 'PATCH',
      body: JSON.stringify({ delta }),
    }),
  deleteProduct: (id: number) => request<{ ok: true }>(`/products/${id}`, { method: 'DELETE' }),

  listSales: (period: string) =>
    request<{ sales: Sale[]; summary: SalesSummary; ranking: RankingItem[] }>(
      `/sales?period=${period}`
    ),
  createSale: (payload: Partial<Sale> & { productId?: number | null }) =>
    request<{ sale: Sale }>('/sales', { method: 'POST', body: JSON.stringify(payload) }),
  deleteSale: (id: number) => request<{ ok: true }>(`/sales/${id}`, { method: 'DELETE' }),

  listQuotes: () => request<{ quotes: Quote[] }>('/quotes'),
  createQuote: (payload: Omit<Quote, 'id' | 'total' | 'createdAt'>) =>
    request<{ quote: Quote }>('/quotes', { method: 'POST', body: JSON.stringify(payload) }),
  deleteQuote: (id: number) => request<{ ok: true }>(`/quotes/${id}`, { method: 'DELETE' }),

  getPlans: () => request<{ plans: Plan[] }>('/billing/plans'),
  createPortalSession: () => request<{ url: string }>('/billing/portal', { method: 'POST' }),
  verifyCheckoutSession: (sessionId: string) =>
    request<{ ok: true }>('/billing/verify-session', { method: 'POST', body: JSON.stringify({ sessionId }) }),
};

export { ApiError };
