import { FormEvent, useState } from 'react';
import { api, ApiError } from '../api';

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const close = () => {
    setOpen(false);
    setError('');
    if (sent) {
      setSent(false);
      setMessage('');
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Escreva sua sugestão antes de enviar.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await api.sendFeedback(message.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar sua sugestão.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <div className="mb-3 w-72 rounded-lg border border-brand-100 bg-white p-4 shadow-lg sm:w-80">
          {sent ? (
            <>
              <p className="mb-3 text-sm text-ink">
                Valeu! Sua sugestão foi enviada. 🙌
              </p>
              <button
                onClick={close}
                className="w-full rounded-md border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
              >
                Fechar
              </button>
            </>
          ) : (
            <form onSubmit={onSubmit}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Sugestões</span>
                <button
                  type="button"
                  onClick={close}
                  className="text-ink/40 hover:text-ink/70"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>
              <p className="mb-2 text-xs text-ink/60">
                Tem alguma ideia, crítica ou algo que não funcionou? Me conta aqui.
              </p>
              {error && <div className="mb-2 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</div>}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Escreva sua sugestão..."
                className="mb-3 w-full rounded-md border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
              >
                {sending ? 'Enviando...' : 'Enviar sugestão'}
              </button>
            </form>
          )}
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-brand-700 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-brand-800"
        >
          💡 Sugestões
        </button>
      )}
    </div>
  );
}
