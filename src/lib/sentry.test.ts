import { describe, it, expect } from 'vitest';
import { initSentry } from './sentry';

describe('Sentry', () => {
    it('initSentry is a function', () => {
        expect(typeof initSentry).toBe('function');
    });

    it('initSentry does not throw', () => {
        expect(() => initSentry()).not.toThrow();
    });
});
