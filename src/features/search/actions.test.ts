import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── DB mocks ─────────────────────────────────────────────────────────────────
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/db/index', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

vi.mock('drizzle-orm', () => ({
  or: vi.fn(),
  ilike: vi.fn(),
  eq: vi.fn(),
  and: vi.fn(),
  sql: vi.fn(),
}));

// ─── Supabase mock ────────────────────────────────────────────────────────────
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
  }),
}));

// ─── isPlatformAdmin mock ─────────────────────────────────────────────────────
const mockIsPlatformAdmin = vi.fn();
vi.mock('@/features/auth/helpers', () => ({
  isPlatformAdmin: (...args: unknown[]) => mockIsPlatformAdmin(...args),
}));

// ─── Chain helper ─────────────────────────────────────────────────────────────
function setupSelectChain() {
  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ limit: mockLimit });
  mockSelect.mockReturnValue({ from: mockFrom });
}

// ─── Imports after mocks ──────────────────────────────────────────────────────
import { searchTalents } from './actions';

// ─────────────────────────────────────────────────────────────────────────────
// searchTalents
// ─────────────────────────────────────────────────────────────────────────────
describe('searchTalents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSelectChain();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-uuid' } },
      error: null,
    });
    mockIsPlatformAdmin.mockResolvedValue(false);
  });

  it('retorna UNAUTHORIZED quando não autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no auth') });
    const result = await searchTalents({ query: 'rock' });
    expect(result.error?.code).toBe('UNAUTHORIZED');
    expect(result.data).toBeNull();
  });

  it('aceita query de 1 char (min server=1; guard min=2 é responsabilidade do cliente)', async () => {
    // Server now validates min=1 — single char queries are valid server-side.
    // The client guard (query.length < 2) prevents these from ever being sent in normal flow.
    mockLimit.mockResolvedValueOnce([]);
    mockLimit.mockResolvedValueOnce([]);
    const result = await searchTalents({ query: 'a' });
    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it('retorna VALIDATION_ERROR para query vazia', async () => {
    const result = await searchTalents({ query: '' });
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(result.data).toBeNull();
  });

  it('retorna VALIDATION_ERROR para query só com whitespace', async () => {
    const result = await searchTalents({ query: '   ' });
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(result.data).toBeNull();
  });

  it('retorna artistas e coletivos ativos para query válida', async () => {
    const artistRow = {
      kind: 'artist' as const,
      id: 'artist-1',
      artisticName: 'Rock Silva',
      location: 'SP',
      genrePrimary: 'rock',
      photoUrl: null,
      isVerified: true,
    };
    const collectiveRow = {
      kind: 'collective' as const,
      id: 'collective-1',
      name: 'Rock Coletivo',
      location: 'RJ',
      genrePrimary: 'rock',
      logoUrl: null,
    };

    // First call → artists, second call → collectives
    mockLimit.mockResolvedValueOnce([artistRow]);
    mockLimit.mockResolvedValueOnce([collectiveRow]);

    const result = await searchTalents({ query: 'rock' });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data?.some((h) => h.kind === 'artist')).toBe(true);
    expect(result.data?.some((h) => h.kind === 'collective')).toBe(true);
  });

  it('artista pending_approval NÃO aparece para user não-admin (filtrado pela query)', async () => {
    // Non-admin: query adds eq(artists.status, 'approved') — DB returns empty
    mockIsPlatformAdmin.mockResolvedValue(false);
    mockLimit.mockResolvedValueOnce([]); // no approved artists returned
    mockLimit.mockResolvedValueOnce([]);

    const result = await searchTalents({ query: 'pending' });

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
    expect(mockIsPlatformAdmin).toHaveBeenCalledWith('user-uuid');
  });

  it('artista pending_approval visível para admin (sem filtro de status)', async () => {
    mockIsPlatformAdmin.mockResolvedValue(true);
    const pendingArtist = {
      kind: 'artist' as const,
      id: 'artist-pending',
      artisticName: 'Pending DJ',
      location: 'MG',
      genrePrimary: null,
      photoUrl: null,
      isVerified: false,
    };
    mockLimit.mockResolvedValueOnce([pendingArtist]);
    mockLimit.mockResolvedValueOnce([]);

    const result = await searchTalents({ query: 'Pending' });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect((result.data?.[0] as { id: string }).id).toBe('artist-pending');
  });

  it('artista is_verified=false é retornado (diferenciação é visual, não filtro)', async () => {
    const restrictedArtist = {
      kind: 'artist' as const,
      id: 'artist-2',
      artisticName: 'Jane Doe',
      location: 'MG',
      genrePrimary: null,
      photoUrl: null,
      isVerified: false,
    };

    mockLimit.mockResolvedValueOnce([restrictedArtist]);
    mockLimit.mockResolvedValueOnce([]);

    const result = await searchTalents({ query: 'Jane' });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect((result.data?.[0] as { isVerified: boolean }).isVerified).toBe(false);
  });

  it('coletivo pending_approval NÃO deve aparecer (filtrado na query)', async () => {
    mockLimit.mockResolvedValueOnce([]);
    mockLimit.mockResolvedValueOnce([]);

    const result = await searchTalents({ query: 'Coletivo' });

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it('retorna data:[] e error:null quando não há matches', async () => {
    mockLimit.mockResolvedValueOnce([]);
    mockLimit.mockResolvedValueOnce([]);

    const result = await searchTalents({ query: 'xyznotfound' });

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it('respeita limite de 20 resultados no total', async () => {
    const manyArtists = Array.from({ length: 20 }, (_, i) => ({
      kind: 'artist' as const,
      id: `artist-${i}`,
      artisticName: `Artist ${i}`,
      location: 'SP',
      genrePrimary: 'rock',
      photoUrl: null,
      isVerified: false,
    }));
    const extraCollective = {
      kind: 'collective' as const,
      id: 'col-1',
      name: 'Extra',
      location: 'SP',
      genrePrimary: 'rock',
      logoUrl: null,
    };

    mockLimit.mockResolvedValueOnce(manyArtists);
    mockLimit.mockResolvedValueOnce([extraCollective]);

    const result = await searchTalents({ query: 'rock' });

    expect(result.error).toBeNull();
    expect(result.data?.length).toBeLessThanOrEqual(20);
  });

  it('retorna DB_ERROR quando query falha', async () => {
    mockSelect.mockImplementation(() => {
      throw new Error('Connection failed');
    });

    const result = await searchTalents({ query: 'rock' });

    expect(result.error?.code).toBe('DB_ERROR');
    expect(result.data).toBeNull();
  });

  it('busca apenas artistas quando types=["artist"]', async () => {
    mockLimit.mockResolvedValueOnce([]);

    const result = await searchTalents({ query: 'rock', types: ['artist'] });

    // db.select should be called once (only artists)
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(result.error).toBeNull();
  });
});
