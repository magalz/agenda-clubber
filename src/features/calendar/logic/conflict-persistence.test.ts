import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventConflicts } from '@/db/schema/event-conflicts';

vi.mock('@/db', () => {
    const mockDb = {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    };
    return { db: mockDb };
});

import { db } from '@/db';
import { syncConflictPairs } from './evaluate-conflict';

function mockSelectResult<T>(result: T) {
    return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(result) }) }) };
}

function mockNeighborsResult<T>(result: T) {
    return { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(result) }) };
}

function mockConflictPairsResult<T>(result: T) {
    return { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(result) }) };
}

describe('syncConflictPairs', () => {
    const eventId = 'e9000000-0000-0000-0000-000000000001';
    const neighborIdA = 'e9000000-0000-0000-0000-000000000002';
    const neighborIdB = 'e9000000-0000-0000-0000-000000000003';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('retorna sem ação se evento candidato não existe', async () => {
        vi.mocked(db.select).mockReturnValue(mockSelectResult([]) as never);

        await syncConflictPairs(eventId, db as never);

        expect(db.select).toHaveBeenCalledTimes(1);
        expect(db.insert).not.toHaveBeenCalled();
        expect(db.delete).not.toHaveBeenCalled();
    });

    it('deleta todos os pares existentes se nível for green', async () => {
        const mockDelete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) });

        vi.mocked(db.select)
            .mockReturnValueOnce(mockSelectResult([
                { id: eventId, eventDate: '2026-06-15', conflictLevel: 'green', conflictJustification: null },
            ]) as never)
            .mockReturnValueOnce(mockNeighborsResult([
                { id: neighborIdA, conflictLevel: 'red' },
            ]) as never)
            .mockReturnValueOnce(mockConflictPairsResult([
                { id: 'p1', eventAId: eventId, eventBId: neighborIdA, status: 'open' },
            ]) as never);

        vi.mocked(db.delete).mockReturnValue(mockDelete() as never);

        await syncConflictPairs(eventId, db as never);

        expect(mockDelete().where).toHaveBeenCalled();
        expect(db.insert).not.toHaveBeenCalled();
    });

    it('cria par de conflito para neighbor com nível non-green', async () => {
        const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue({}) }) });
        const mockDelete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) });

        vi.mocked(db.select)
            .mockReturnValueOnce(mockSelectResult([
                { id: eventId, eventDate: '2026-06-15', conflictLevel: 'red', conflictJustification: 'Conflito' },
            ]) as never)
            .mockReturnValueOnce(mockNeighborsResult([
                { id: neighborIdA, conflictLevel: 'red' },
            ]) as never)
            .mockReturnValueOnce(mockConflictPairsResult([]) as never);

        vi.mocked(db.insert).mockReturnValue(mockInsert() as never);
        vi.mocked(db.delete).mockReturnValue(mockDelete() as never);

        await syncConflictPairs(eventId, db as never);

        expect(mockInsert().values).toHaveBeenCalled();
        expect(db.delete).not.toHaveBeenCalled();
    });

    it('preserva par com status consensual_agreement mesmo se conflito ainda ativo', async () => {
        const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue({}) }) });
        const mockDelete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) });

        vi.mocked(db.select)
            .mockReturnValueOnce(mockSelectResult([
                { id: eventId, eventDate: '2026-06-15', conflictLevel: 'red', conflictJustification: 'Conflito' },
            ]) as never)
            .mockReturnValueOnce(mockNeighborsResult([
                { id: neighborIdA, conflictLevel: 'red' },
            ]) as never)
            .mockReturnValueOnce(mockConflictPairsResult([
                { id: 'p1', eventAId: neighborIdA, eventBId: eventId, status: 'consensual_agreement' },
            ]) as never);

        vi.mocked(db.insert).mockReturnValue(mockInsert() as never);
        vi.mocked(db.delete).mockReturnValue(mockDelete() as never);

        await syncConflictPairs(eventId, db as never);

        expect(db.delete).not.toHaveBeenCalled();
        expect(db.insert).not.toHaveBeenCalled();
    });

    it('deleta par cujo neighbor não tem mais conflito', async () => {
        const mockDelete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) });

        vi.mocked(db.select)
            .mockReturnValueOnce(mockSelectResult([
                { id: eventId, eventDate: '2026-06-15', conflictLevel: 'red', conflictJustification: 'Conflito' },
            ]) as never)
            .mockReturnValueOnce(mockNeighborsResult([
                { id: neighborIdA, conflictLevel: 'green' },
            ]) as never)
            .mockReturnValueOnce(mockConflictPairsResult([
                { id: 'p1', eventAId: eventId, eventBId: neighborIdA, status: 'open' },
            ]) as never);

        vi.mocked(db.delete).mockReturnValue(mockDelete() as never);

        await syncConflictPairs(eventId, db as never);

        expect(mockDelete().where).toHaveBeenCalled();
        expect(db.insert).not.toHaveBeenCalled();
    });

    it('trata dois neighbors simultaneamente', async () => {
        const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue({}) }) });
        const mockDelete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) });

        vi.mocked(db.select)
            .mockReturnValueOnce(mockSelectResult([
                { id: eventId, eventDate: '2026-06-15', conflictLevel: 'yellow', conflictJustification: 'Conflito' },
            ]) as never)
            .mockReturnValueOnce(mockNeighborsResult([
                { id: neighborIdA, conflictLevel: 'yellow' },
                { id: neighborIdB, conflictLevel: 'red' },
            ]) as never)
            .mockReturnValueOnce(mockConflictPairsResult([]) as never);

        vi.mocked(db.insert).mockReturnValue(mockInsert() as never);
        vi.mocked(db.delete).mockReturnValue(mockDelete() as never);

        await syncConflictPairs(eventId, db as never);

        expect(mockInsert().values).toHaveBeenCalledTimes(2);
    });
});

describe('eventConflicts schema', () => {
    it('exporta a tabela com colunas esperadas', () => {
        expect(eventConflicts).toBeDefined();
        expect(eventConflicts.eventAId).toBeDefined();
        expect(eventConflicts.eventBId).toBeDefined();
        expect(eventConflicts.rule).toBeDefined();
        expect(eventConflicts.level).toBeDefined();
        expect(eventConflicts.justification).toBeDefined();
        expect(eventConflicts.status).toBeDefined();
        expect(eventConflicts.resolvedByA).toBeDefined();
        expect(eventConflicts.resolvedByB).toBeDefined();
        expect(eventConflicts.resolvedAtA).toBeDefined();
        expect(eventConflicts.resolvedAtB).toBeDefined();
    });
});
