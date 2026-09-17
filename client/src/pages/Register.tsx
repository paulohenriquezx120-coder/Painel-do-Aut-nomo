import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ApiError } from '../api';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, businessName, email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar sua conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7f6] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-700 text-base font-bold text-white">
            P
          </div>
          <h1 className="text-lg font-semibold text-brand-800">Painel do Autônomo</h1>
          <p className="text-sm text-ink/60">Comece grátis, leva menos de um minuto</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-lg border border-brand-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-ink">Criar conta</h2>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <label className="mb-3 block text-sm">
            <span className="mb-1 block font-medium text-ink/80">Seu nome</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="Maria Silva"
            />
          </label>

          <label className="mb-3 block text-sm">
            <span className="mb-1 block font-medium text-ink/80">Nome do negócio</span>
            <input
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="Loja da Maria"
            />
          </label>

          <label className="mb-3 block text-sm">
            <span className="mb-1 block font-medium text-ink/80">E-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="voce@email.com"
            />
          </label>

          <label className="mb-5 block text-sm">
            <span className="mb-1 block font-medium text-ink/80">Senha</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="Mínimo 6 caracteres"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {loading ? 'Criando...' : 'Criar conta'}
          </button>

          <p className="mt-4 text-center text-sm text-ink/60">
            Já tem conta?{' '}
            <Link to="/entrar" className="font-medium text-brand-700 hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
