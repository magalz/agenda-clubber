import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockCtx = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('resend', () => {
    class MockResend {
        emails = { send: mockCtx.send };
    }
    return { Resend: MockResend };
});

import { sendArtistClaimInvitation } from './resend';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, RESEND_API_KEY: 're_test_key', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' };
    mockCtx.send.mockReset();
});

afterEach(() => {
    process.env = ORIGINAL_ENV;
});

describe('sendArtistClaimInvitation', () => {
    it('retorna erro se RESEND_API_KEY nao configurado', async () => {
        delete process.env.RESEND_API_KEY;

        const result = await sendArtistClaimInvitation('test@test.com', 'DJ Test');

        expect(result.sent).toBe(false);
        expect(result.error).toContain('RESEND_API_KEY');
    });

    it('envia email com sucesso e retorna sent:true', async () => {
        mockCtx.send.mockResolvedValueOnce({});

        const result = await sendArtistClaimInvitation('artista@cena.com', 'DJ On The Fly');

        expect(result.sent).toBe(true);
        expect(mockCtx.send).toHaveBeenCalledTimes(1);
        expect(mockCtx.send.mock.calls[0][0].to).toBe('artista@cena.com');
        expect(mockCtx.send.mock.calls[0][0].subject).toContain('DJ On The Fly');
    });

    it('retorna erro se o Resend lancar excecao', async () => {
        mockCtx.send.mockRejectedValueOnce(new Error('Resend API error'));

        const result = await sendArtistClaimInvitation('artista@cena.com', 'DJ On The Fly');

        expect(result.sent).toBe(false);
        expect(result.error).toBe('Resend API error');
    });

    it('usa NEXT_PUBLIC_SITE_URL no link de claim', async () => {
        mockCtx.send.mockResolvedValueOnce({});

        await sendArtistClaimInvitation('artista@cena.com', 'DJ Test');

        const html = mockCtx.send.mock.calls[0][0].html;
        expect(html).toContain('http://localhost:3000/claim-artist?name=DJ%20Test');
    });
});
