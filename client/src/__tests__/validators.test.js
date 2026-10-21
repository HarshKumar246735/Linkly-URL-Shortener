import { describe, expect, it } from 'vitest';
import {
  normalizeUrlInput, validateAlias, validateExpiry, validateLoginForm,
  validatePassword, validateRegisterForm, validateUrlInput,
} from '../utils/validators';

describe('URL validation', () => {
  it('accepts normal URLs and adds https:// when missing', () => {
    expect(validateUrlInput('https://example.com/a')).toBe('');
    expect(validateUrlInput('example.com/page')).toBe('');
    expect(normalizeUrlInput(' example.com/page ')).toBe('https://example.com/page');
  });
  it('rejects empty, dangerous and malformed URLs', () => {
    expect(validateUrlInput('')).toMatch(/enter a URL/i);
    expect(validateUrlInput('javascript:alert(1)')).toMatch(/http/i);
    expect(validateUrlInput('data:text/html,hi')).toMatch(/http/i);
    expect(validateUrlInput('file:///etc/passwd')).toMatch(/http/i);
    expect(validateUrlInput('not a url')).not.toBe('');
  });
});

describe('alias and expiry validation', () => {
  it('allows empty aliases and valid aliases', () => {
    expect(validateAlias('')).toBe('');
    expect(validateAlias('spring-sale_24')).toBe('');
  });
  it('rejects bad and reserved aliases', () => {
    expect(validateAlias('ab')).not.toBe('');
    expect(validateAlias('has space')).not.toBe('');
    expect(validateAlias('Dashboard')).toMatch(/reserved/i);
  });
  it('requires expiry to be in the future', () => {
    expect(validateExpiry('')).toBe('');
    expect(validateExpiry('2001-01-01T10:00')).toMatch(/future/i);
    const future = new Date(Date.now() + 86400000);
    const pad = (n) => String(n).padStart(2, '0');
    const local = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`;
    expect(validateExpiry(local)).toBe('');
  });
});

describe('auth form validation', () => {
  it('validates registration fields', () => {
    const errors = validateRegisterForm({ name: 'A', email: 'bad', password: 'short', confirmPassword: 'other' });
    expect(Object.keys(errors).sort()).toEqual(['confirmPassword', 'email', 'name', 'password']);
    expect(validateRegisterForm({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'Passw0rdOK', confirmPassword: 'Passw0rdOK' })).toEqual({});
  });
  it('enforces password rules', () => {
    expect(validatePassword('alllowercase')).toMatch(/number/);
    expect(validatePassword('12345678')).toMatch(/letter/);
    expect(validatePassword('Passw0rdOK')).toBe('');
  });
  it('validates the login form', () => {
    expect(validateLoginForm({ email: '', password: '' })).toMatchObject({ email: expect.any(String), password: expect.any(String) });
    expect(validateLoginForm({ email: 'a@b.co', password: 'x' })).toEqual({});
  });
});
