import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Obfuscator } from './obfuscator.js';

describe('Obfuscator', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();

		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: vi.fn().mockImplementation((query) => {
				return {
					matches: true,
					media: query,
					onchange: null,
					addListener: vi.fn(),
					removeListener: vi.fn(),
					addEventListener: vi.fn(),
					removeEventListener: vi.fn(),
					dispatchEvent: vi.fn(),
				};
			}),
		});
	});

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

		it('should decode string if it is already valid Base64 obfuscated text', () => {
			const plainText = 'secret message';
			const obfuscatedText = Obfuscator.obfuscate(plainText);
			const result = Obfuscator.obfuscateUnlessBase64(obfuscatedText);

			expect(result.deobfuscated).toBe(plainText);
			expect(result.obfuscated).toBe(obfuscatedText);
		});
	});

	describe('DOM Processing & Link Protection', () => {
		it('should decode protected links on user interaction (restoreProtectedLink)', () => {
			const email = 'hello@example.com';
			const link = document.createElement('a');
			link.href = '#';
			link.className = 'protected-link';
			link.dataset.enc = Obfuscator.obfuscate(email);
			link.dataset.type = 'mailto';
			document.body.appendChild(link);

			const mockEvent = {
				type: 'click',
				target: link,
				preventDefault: vi.fn(),
			};
			Obfuscator.restoreProtectedLink(mockEvent);

			expect(link.href).toBe(`mailto:${email}`);
			expect(link.classList.contains('protected-link')).toBe(false);
			expect(mockEvent.preventDefault).toHaveBeenCalled();
		});

		it('should reveal all protected links for printing (revealAllForPrint)', () => {
			const phone = '+1234567890';
			const link1 = document.createElement('a');
			link1.className = 'protected-link';
			link1.dataset.enc = Obfuscator.obfuscate(phone);
			link1.dataset.type = 'tel';

			const link2 = document.createElement('a');
			link2.className = 'protected-link';
			link2.dataset.enc = Obfuscator.obfuscate('test@test.com');
			link2.dataset.type = 'mailto';

			document.body.appendChild(link1);
			document.body.appendChild(link2);

			Obfuscator.revealAllForPrint();

			expect(link1.href).toBe(`tel:${phone}`);
			expect(link2.href).toBe('mailto:test@test.com');
			expect(document.querySelectorAll('.protected-link').length).toBe(0);
		});

		it('should decode inline payloads injected by marked (processDomElements)', () => {
			const secretHtml = '<b>hidden text</b>';
			const container = document.createElement('div');
			const span = document.createElement('span');

			span.className = Obfuscator.TARGET_SELECTOR.replace('.', '');
			span.dataset.payload = Obfuscator.obfuscate(secretHtml);
			container.appendChild(span);
			document.body.appendChild(container);

			Obfuscator.processDomElements(container);

			const processedSpan = container.querySelector('span');
			expect(processedSpan.innerHTML).toBe(secretHtml);
		});
	});

	describe('Marked Extension Configuration', () => {
		it('should return valid marked.js configuration objects', () => {
			const config = Obfuscator.getMarkedExtension();

			expect(config).toHaveProperty('extensions');
			expect(config).toHaveProperty('renderer');
			expect(Array.isArray(config.extensions)).toBe(true);
			expect(config.extensions[0].name).toBe(Obfuscator.EXTENSION_NAME);
			expect(typeof config.extensions[0].tokenizer).toBe('function');
			expect(typeof config.renderer.link).toBe('function');
		});
	});

	describe('Epoch Token Injection', () => {
		beforeEach(() => {
			vi.useFakeTimers();
			// Set a fixed timestamp
			vi.setSystemTime(new Date('2026-08-28T12:00:00Z'));
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should replace the epoch token with a base36 timestamp in links', () => {
			const config = Obfuscator.getMarkedExtension();
			const linkRenderer = config.renderer.link;

			const token = {
				href: 'mailto:test.__EPOCH__@example.com',
				text: 'test.__EPOCH__@example.com',
				title: '',
			};

			const result = linkRenderer(token);

			// Get expected base36 string for our mocked time
			const expectedTimestamp = Date.now().toString(36);
			const expectedEmail = `test.${expectedTimestamp}@example.com`;

			// Create a temporary DOM element to parse the HTML string output
			const div = document.createElement('div');
			div.innerHTML = result;
			const anchor = div.querySelector('a');

			// Extract and decode the encoded href and text attributes
			const decodedHref = Obfuscator.deobfuscate(anchor.getAttribute('data-enc'));
			const decodedText = Obfuscator.deobfuscate(anchor.getAttribute('data-text-enc'));

			expect(decodedHref).toBe(expectedEmail);
			expect(decodedText).toBe(expectedEmail);
		});
	});
});
