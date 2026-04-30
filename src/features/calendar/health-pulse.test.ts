import { describe, it, expect } from 'vitest';
import { aggregateHighestLevel } from './health-pulse';

describe('aggregateHighestLevel', () => {
    it('returns null for empty array', () => {
        expect(aggregateHighestLevel([])).toBeNull();
    });

    it('returns the only level when single element', () => {
        expect(aggregateHighestLevel(['green'])).toBe('green');
    });

    it('returns the highest priority level', () => {
        expect(aggregateHighestLevel(['green', 'yellow'])).toBe('yellow');
    });

    it('returns red when red is present', () => {
        expect(aggregateHighestLevel(['yellow', 'green', 'red'])).toBe('red');
    });

    it('returns green when all are green', () => {
        expect(aggregateHighestLevel(['green', 'green', 'green'])).toBe('green');
    });

    it('returns red when multiple red present', () => {
        expect(aggregateHighestLevel(['red', 'red', 'yellow'])).toBe('red');
    });
});
