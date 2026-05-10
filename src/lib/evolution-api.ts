const INSTANCE_NAME = 'agenda-clubber-admin';

type EvolutionResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
};

function getConfig(): { baseUrl: string; apiKey: string; adminGroupId: string } {
    return {
        baseUrl: process.env.EVOLUTION_API_URL ?? '',
        apiKey: process.env.EVOLUTION_API_KEY ?? '',
        adminGroupId: process.env.EVOLUTION_ADMIN_GROUP_ID ?? '',
    };
}

async function request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: unknown
): Promise<EvolutionResponse<T>> {
    const { baseUrl, apiKey } = getConfig();
    if (!baseUrl || !apiKey) {
        return { success: false, error: 'EVOLUTION_API_URL or EVOLUTION_API_KEY not configured' };
    }

    try {
        const res = await fetch(`${baseUrl}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                apikey: apiKey,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            return { success: false, error: `Evolution API returned ${res.status}: ${text}` };
        }

        const data = await res.json();
        return { success: true, data: data as T };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
    }
}

async function ensureInstance(): Promise<EvolutionResponse> {
    const result = await request('/instance/create', 'POST', {
        instanceName: INSTANCE_NAME,
        qrcode: false,
        number: '',
    });
    return result;
}

export async function sendAdminGroupMessage(
    message: string
): Promise<EvolutionResponse> {
    const { adminGroupId } = getConfig();
    if (!adminGroupId) {
        return { success: false, error: 'EVOLUTION_ADMIN_GROUP_ID not configured' };
    }

    await ensureInstance();

    return request('/message/sendText/' + INSTANCE_NAME, 'POST', {
        number: adminGroupId,
        options: { delay: 1200, presence: 'composing' },
        text: message,
    });
}

export function generateAdminGroupDeepLink(): string {
    const { adminGroupId } = getConfig();
    if (!adminGroupId) return '';
    return `https://wa.me/${adminGroupId.replace('@g.us', '')}?text=Agenda%20Clubber%20-%20Admin`;
}
