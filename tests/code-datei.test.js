import { describe, it, expect } from 'vitest';
import { newCode, readCode, findCode, codeFileText, CODE_FILE_NAME } from '../src/lib/sync/code.js';

describe('the code kept as a file (Noah 22.11.2026 «4a»)', () => {
  it('the saved file holds the code and findCode reads it back', () => {
    const code = newCode();
    const text = codeFileText(code);
    expect(text).toContain(code);
    expect(findCode(text)).toBe(code);
    expect(CODE_FILE_NAME).toMatch(/\.txt$/);
  });
  it('findCode also takes a bare or retyped code and refuses a text without one', () => {
    const code = newCode();
    expect(findCode(code)).toBe(code);
    expect(findCode(code.toLowerCase().replace(/-/g, ' '))).toBe(readCode(code));
    expect(findCode('hello there, no code in here')).toBeNull();
    expect(findCode('')).toBeNull();
  });
});
