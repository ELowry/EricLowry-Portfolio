import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Lang } from './lang.js';

vi.mock('./inputPrompts.js', () => ({
	InputPrompts: {
		init: vi.fn().mockResolvedValue(),
	},
}));

describe('LangController', () => {
	const mockLangsMap = {
		en: ['en_US'],
		fr: ['fr_FR'],
	};

	const mockEnUSData = {
		meta: {
			title: 'My Portfolio',
			lang: 'en',
		},
		ui: {
			greeting: 'Hello',
			formatted: 'Welcome, {0}!',
		},
	};

	beforeEach(() => {
		document.body.innerHTML = '';
		document.documentElement.lang = '';
		localStorage.clear();

		global.fetch = vi.fn(async (url) => {
			if (url.includes('langs.json')) {
				return { ok: true, json: async () => mockLangsMap };
			}
			if (url.includes('en_US.json')) {
				return { ok: true, json: async () => mockEnUSData };
			}
			return { ok: false, status: 404 };
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Initialization', () => {
		it('should load default language data and translate the document', async () => {
			const data = await Lang.init();

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/lang/langs.json'),
				expect.objectContaining({ signal: expect.any(AbortSignal) })
			);
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/lang/en_US.json'),
				expect.objectContaining({ signal: expect.any(AbortSignal) })
			);
			expect(Lang.isLoaded).toBe(true);
			expect(data).toEqual(mockEnUSData);
			expect(document.documentElement.lang).toBe('en');
			expect(document.body.classList.contains('translated')).toBe(true);
		});
	});

	describe('getString', () => {
		beforeEach(async () => {
			await Lang.init();
		});

		it('should retrieve a top-level string', () => {
			expect(Lang.getString('ui.greeting')).toBe('Hello');
		});

		it('should retrieve a deeply nested string', () => {
			expect(Lang.getString('meta.title')).toBe('My Portfolio');
		});

		it('should return a custom fallback if path is not found', () => {
			expect(Lang.getString('ui.doesnt_exist', null, 'Fallback Text')).toBe('Fallback Text');
		});

		it('should return "notFound" if no fallback is provided', () => {
			expect(Lang.getString('ui.doesnt_exist')).toBe('notFound');
		});
	});

	describe('DOM Translation (translateHtml)', () => {
		beforeEach(async () => {
			await Lang.init();
		});

		it('should translate innerHTML of elements with the .lang class', () => {
			const div = document.createElement('div');
			div.className = 'lang';
			div.dataset.lang = 'ui.greeting';
			document.body.appendChild(div);

			Lang.translateHtml(document.body, Lang.data);

			expect(div.innerHTML).toBe('Hello');
			expect(div.classList.contains('langHide')).toBe(false);
		});

		it('should handle zero-width space placeholders {0}', () => {
			const div = document.createElement('div');
			div.className = 'lang';
			div.dataset.lang = 'ui.formatted';
			div.innerHTML = '\u200BEric\u200B';
			document.body.appendChild(div);

			Lang.translateHtml(document.body, Lang.data);

			expect(div.innerHTML).toBe('Welcome, \u200BEric\u200B!');
		});

		it('should hide elements if the translation is not found', () => {
			const div = document.createElement('div');
			div.className = 'lang';
			div.dataset.lang = 'invalid.path';
			document.body.appendChild(div);

			Lang.translateHtml(document.body, Lang.data);

			expect(div.classList.contains('langHide')).toBe(true);
		});
	});
});
