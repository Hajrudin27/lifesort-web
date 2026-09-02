export async function sendEmail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }): Promise<{ ok: boolean; error?: string }> {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return { ok: false, error: 'RESEND_API_KEY er ikke konfigureret på serveren' };
    }
  
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // TODO: skift til en afsenderadresse på jeres eget verificerede domæne
        // (fx support@lifesort.app) — onboarding@resend.dev kan kun sende til
        // den email, jeres Resend-konto selv er oprettet med.
        from: 'LifeSort Support <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    });
  
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend fejlede: ${body}` };
    }
  
    return { ok: true };
  }
  
  export function escapeHtml(str: string) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }