const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM || 'Painel do Autônomo <onboarding@resend.dev>';

async function sendPasswordResetEmail(to, resetUrl) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada — link de redefinição (não enviado por e-mail):', resetUrl);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to,
      subject: 'Redefinir sua senha — Painel do Autônomo',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1e4d4a;">Redefinir sua senha</h2>
          <p>Recebemos um pedido para redefinir a senha da sua conta no Painel do Autônomo.</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; background: #1e4d4a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
              Redefinir senha
            </a>
          </p>
          <p style="color: #666; font-size: 13px;">Esse link expira em 1 hora. Se você não pediu isso, pode ignorar este e-mail.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('Falha ao enviar e-mail via Resend:', res.status, body);
  }
}

const FEEDBACK_TO = process.env.FEEDBACK_EMAIL || (process.env.ADMIN_EMAILS || '').split(',')[0]?.trim();

async function sendSuggestionEmail({ name, businessName, email, message }) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada — sugestão não enviada por e-mail:', message);
    return false;
  }
  if (!FEEDBACK_TO) {
    console.warn('FEEDBACK_EMAIL/ADMIN_EMAILS não configurado — não sei pra quem mandar a sugestão.');
    return false;
  }

  const escape = (v) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: FEEDBACK_TO,
      reply_to: email,
      subject: `Nova sugestão — ${businessName || name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #1e4d4a;">Nova sugestão no Painel do Autônomo</h2>
          <p><strong>De:</strong> ${escape(name)} (${escape(businessName)})<br/>
          <strong>E-mail:</strong> ${escape(email)}</p>
          <p style="white-space: pre-wrap; background: #f5f7f6; padding: 12px 16px; border-radius: 8px;">${escape(message)}</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('Falha ao enviar sugestão via Resend:', res.status, body);
    return false;
  }
  return true;
}

module.exports = { sendPasswordResetEmail, sendSuggestionEmail };
