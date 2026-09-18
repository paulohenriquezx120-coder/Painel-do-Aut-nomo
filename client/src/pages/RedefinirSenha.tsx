import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api';

export default function RedefinirSenha() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/entrar'), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível redefinir a senha.');
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
          <h2 className="mb-4 text-base font-semibold text-ink">Nova senha</h2>

          {!token && (
            <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              Link inválido. Peça uma nova redefinição.
            </div>
          )}

          {done ? (
            <div className="rounded-md bg-brand-50 px-3 py-3 text-sm text-ink">
              Senha redefinida! Levando você para o login...
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              {error && (
                <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}
              <label className="mb-3 block text-sm">
                <span className="mb-1 block font-medium text-ink/80">Nova senha</span>
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
              <label className="mb-5 block text-sm">
                <span className="mb-1 block font-medium text-ink/80">Confirmar nova senha</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </label>
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full rounded-md btn-grad px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
              >
                {loading ? 'Salvando...' : 'Redefinir senha'}
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
