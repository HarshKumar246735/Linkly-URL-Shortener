import { describe, expect, it } from 'vitest';
import { isReservedCode, isValidCodeFormat } from '../utils/alias.js';
import { generateShortCode } from '../utils/generateShortCode.js';
import { isSafeRedirectTarget, validateDestinationUrl } from '../utils/validateUrl.js';

describe('validateDestinationUrl', () => {
  it('accepts http and https', () => {
    expect(validateDestinationUrl('https://example.com/a?b=1#c')).toMatchObject({ ok: true });
    expect(validateDestinationUrl('  http://example.com ').url).toBe('http://example.com/');
  });
  it('rejects dangerous schemes', () => {
    for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/plain,hi', 'file:///etc/passwd', 'vbscript:x', 'ftp://x.com']) {
      expect(validateDestinationUrl(bad).ok, bad).toBe(false);
    }
  });
  it('rejects garbage and empty values', () => {
    expect(validateDestinationUrl('').ok).toBe(false);
    expect(validateDestinationUrl('example.com').ok).toBe(false);
    expect(validateDestinationUrl(42).ok).toBe(false);
  });
  it('checks redirect targets', () => {
    expect(isSafeRedirectTarget('https://example.com')).toBe(true);
    expect(isSafeRedirectTarget('javascript:alert(1)')).toBe(false);
  });
});

describe('alias policy and code generation', () => {
  it('validates formats and reserved words', () => {
    expect(isValidCodeFormat('abc-123_X')).toBe(true);
    expect(isValidCodeFormat('a b')).toBe(false);
    expect(isReservedCode('API')).toBe(true);
    expect(isReservedCode('my-brand')).toBe(false);
  });
  it('generates 7-character alphanumeric codes', () => {
    for (let i = 0; i < 50; i += 1) expect(generateShortCode()).toMatch(/^[A-Za-z0-9]{7}$/);
  });
});
