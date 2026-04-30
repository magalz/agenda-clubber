import { describe, expect, it } from 'vitest';

import { escapeLikePattern } from './like-pattern';

describe('escapeLikePattern', () => {
  it('escapa o caractere %', () => {
    expect(escapeLikePattern('50%')).toBe('50\\%');
  });

  it('escapa o caractere _', () => {
    expect(escapeLikePattern('a_b')).toBe('a\\_b');
  });

  it('escapa o caractere \\', () => {
    expect(escapeLikePattern('foo\\bar')).toBe('foo\\\\bar');
  });

  it('escapa múltiplos metacaracteres na mesma string', () => {
    expect(escapeLikePattern('%a_b\\c')).toBe('\\%a\\_b\\\\c');
  });

  it('preserva strings sem metacaracteres', () => {
    expect(escapeLikePattern('João Pedro')).toBe('João Pedro');
  });

  it('preserva string vazia', () => {
    expect(escapeLikePattern('')).toBe('');
  });
});
