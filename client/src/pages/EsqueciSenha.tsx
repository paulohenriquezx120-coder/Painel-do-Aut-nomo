import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar o link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center page-bg bg-[#f5f7f6] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <img src="/icon.svg" alt="" className="h-12 w-12 rounded-xl shadow-md shadow-brand-900/20" />
          <h1 className="text-lg font-semibold text-brand-800">Painel do Autônomo</h1>
        </div>

        <div className="card p-6 shadow-lg shadow-brand-900/10">
          <h2 className="mb-4 text-base font-semibold text-ink">Esqueci minha senha</h2>

          {sent ? (
            <div className="rounded-md bg-brand-50 px-3 py-3 text-sm text-ink">
              Se esse e-mail tiver uma conta, enviamos um link de redefinição. Confira sua caixa de entrada (e o spam).
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              {error && (
                <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}
              <label className="mb-5 block text-sm">
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
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md btn-grad px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
              >
                {loading ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-ink/60">
            <Link to="/entrar" className="font-medium text-brand-700 hover:underline">
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
