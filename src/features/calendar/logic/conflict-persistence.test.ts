import { describe, it, expect } from 'vitest';
import { eventConflicts } from '@/db/schema/event-conflicts';

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
