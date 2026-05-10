import { Resend } from 'resend';

function getResendClient(): Resend {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('Missing API key. Pass it to the constructor `new Resend("re_123")`');
    return new Resend(key);
}

export async function sendArtistClaimInvitation(
    email: string,
    artisticName: string
): Promise<{ sent: boolean; error?: string }> {
    if (!process.env.RESEND_API_KEY) {
        return { sent: false, error: 'RESEND_API_KEY not configured' };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const claimUrl = `${siteUrl}/claim-artist?name=${encodeURIComponent(artisticName)}`;

    try {
        await getResendClient().emails.send({
            from: 'Agenda Clubber <noreply@agendaclubber.com>',
            to: email,
            subject: `Seu perfil foi criado na Agenda Clubber, ${artisticName}!`,
            html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                    <h1 style="color: #000; font-size: 24px;">Olá, ${artisticName}!</h1>
                    <p style="color: #333; font-size: 16px; line-height: 1.5;">
                        Um produtor registrou seu perfil artístico na <strong>Agenda Clubber</strong>.
                    </p>
                    <p style="color: #333; font-size: 16px; line-height: 1.5;">
                        Reivindique seu perfil para gerenciar seus dados, adicionar foto, presskit e
                        controlar sua privacidade.
                    </p>
                    <a href="${claimUrl}"
                       style="display: inline-block; background: #000; color: #fff; padding: 12px 24px;
                              text-decoration: none; border-radius: 6px; font-size: 16px; margin: 16px 0;">
                        Reivindicar Perfil
                    </a>
                    <p style="color: #888; font-size: 14px;">
                        Se você não reconhece este perfil, ignore este e-mail.
                    </p>
                </div>
            `,
        });
        return { sent: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { sent: false, error: message };
    }
}
