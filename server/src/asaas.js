const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_ENV = process.env.ASAAS_ENV === 'production' ? 'production' : 'sandbox';
const BASE_URL =
  ASAAS_ENV === 'production' ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3';

async function asaasRequest(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.errors?.[0]?.description || 'Erro na comunicação com o Asaas.';
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function findCustomerByCpfCnpj(cpfCnpj) {
  const data = await asaasRequest(`/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}`);
  return data.data?.[0] || null;
}

function createCustomer(payload) {
  return asaasRequest('/customers', { method: 'POST', body: JSON.stringify(payload) });
}

function createSubscription(payload) {
  return asaasRequest('/subscriptions', { method: 'POST', body: JSON.stringify(payload) });
}

function getSubscription(id) {
  return asaasRequest(`/subscriptions/${id}`);
}

function cancelSubscription(id) {
  return asaasRequest(`/subscriptions/${id}`, { method: 'DELETE' });
}

function listSubscriptionPayments(id) {
  return asaasRequest(`/subscriptions/${id}/payments`);
}

module.exports = {
  isConfigured: () => Boolean(ASAAS_API_KEY),
  findCustomerByCpfCnpj,
  createCustomer,
  createSubscription,
  getSubscription,
  cancelSubscription,
  listSubscriptionPayments,
};
