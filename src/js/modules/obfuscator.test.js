import { describe, it, expect } from 'vitest';
import { Obfuscator } from './obfuscator.js';

describe('Obfuscator', () => {
	describe('obfuscate and deobfuscate', () => {
		it('should obfuscate a string', () => {
			const original = 'test@example.com';
			const obfuscated = Obfuscator.obfuscate(original);
			expect(obfuscated).not.toBe(original);
			expect(typeof obfuscated).toBe('string');
		});

		it('should deobfuscate an obfuscated string back to the original', () => {
			const original = 'hello world 123!';
			const obfuscated = Obfuscator.obfuscate(original);
			const deobfuscated = Obfuscator.deobfuscate(obfuscated);
			expect(deobfuscated).toBe(original);
		});

		it('should handle empty or null values gracefully', () => {
			expect(Obfuscator.obfuscate('')).toBe('');
			expect(Obfuscator.deobfuscate('')).toBe('');
			expect(Obfuscator.obfuscate(null)).toBe('');
			expect(Obfuscator.deobfuscate(null)).toBe('');
		});
	});

	describe('obfuscateUnlessBase64', () => {
		it('should obfuscate plain text', () => {
			const text = 'plain text';
			const result = Obfuscator.obfuscateUnlessBase64(text);
			expect(result.obfuscated).toBe(Obfuscator.obfuscate(text));
			expect(result.deobfuscated).toBe(text);
		});
	});
});
