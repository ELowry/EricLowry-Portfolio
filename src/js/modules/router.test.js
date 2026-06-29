import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from './router.js';

describe('RouterController', () => {
	beforeEach(() => {
		vi.restoreAllMocks();

		// Stub window.location to prevent JSDOM navigation crash errors
		vi.stubGlobal('location', {
			href: 'http://localhost/',
			pathname: '/',
			hostname: 'localhost',
			hash: '',
		});

		Router.state = { mode: 'game', path: '' };
		Router.onStateChange = null;
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe('sanitizePath', () => {
		it('should clean leading and trailing slashes', () => {
			expect(Router.sanitizePath('/about/cv/')).toBe('about/cv');
			expect(Router.sanitizePath('about/cv')).toBe('about/cv');
		});

		it('should collapse multiple duplicate slashes', () => {
			expect(Router.sanitizePath('architecture///projects//unstant')).toBe(
				'architecture/projects/unstant'
			);
		});

		it('should return empty string for null, undefined, or empty values', () => {
			expect(Router.sanitizePath('')).toBe('');
			expect(Router.sanitizePath(null)).toBe('');
			expect(Router.sanitizePath(undefined)).toBe('');
		});
	});

	describe('readURL', () => {
		it('should parse window.location.pathname and apply state', async () => {
			window.location.pathname = '/text/about/bio';
			const applyStateSpy = vi.spyOn(Router, 'applyState');

			await Router.readURL();

			expect(applyStateSpy).toHaveBeenCalledWith({ mode: 'text', path: 'about/bio' }, true);
			expect(Router.currentMode).toBe('text');
			expect(Router.currentPath).toBe('about/bio');
		});
	});

	describe('go', () => {
		it('should push new state to history and update state properties', async () => {
			const pushStateSpy = vi.spyOn(window.history, 'pushState');
			const callback = vi.fn();
			Router.onStateChange = callback;

			await Router.go('text', 'about/cv');

			expect(Router.currentMode).toBe('text');
			expect(Router.currentPath).toBe('about/cv');
			expect(pushStateSpy).toHaveBeenCalledWith(
				{ mode: 'text', path: 'about/cv' },
				'',
				'/text/about/cv'
			);
			expect(callback).toHaveBeenCalledWith({ mode: 'text', path: 'about/cv' });
		});

		it('should ignore redundant transitions to the same state', async () => {
			const pushStateSpy = vi.spyOn(window.history, 'pushState');
			Router.state = { mode: 'text', path: 'about/cv' };

			await Router.go('text', 'about/cv');

			expect(pushStateSpy).not.toHaveBeenCalled();
		});

		it('should omit the mode prefix for blog paths', async () => {
			const pushStateSpy = vi.spyOn(window.history, 'pushState');
			const callback = vi.fn();
			Router.onStateChange = callback;

			await Router.go('text', 'blog/2026-05-30');

			expect(Router.currentMode).toBe('text');
			expect(Router.currentPath).toBe('blog/2026-05-30');
			expect(pushStateSpy).toHaveBeenCalledWith(
				{ mode: 'text', path: 'blog/2026-05-30' },
				'',
				'/blog/2026-05-30'
			);
		});

		it('should handle same-page anchor navigation smoothly without full transition', async () => {
			const pushStateSpy = vi.spyOn(window.history, 'pushState');
			const scrollIntoViewMock = vi.fn();
			const elem = { scrollIntoView: scrollIntoViewMock };
			vi.spyOn(document, 'getElementById').mockReturnValue(elem);

			Router.state = { mode: 'text', path: 'about/cv' };
			const callback = vi.fn();
			Router.onStateChange = callback;

			await Router.go('text', 'about/cv', '#my-anchor');

			expect(pushStateSpy).toHaveBeenCalledWith(
				{ mode: 'text', path: 'about/cv' },
				'',
				'/text/about/cv#my-anchor'
			);
			expect(scrollIntoViewMock).toHaveBeenCalled();
			expect(callback).not.toHaveBeenCalled();
		});

		it('should handle malformed hashes gracefully without throwing URIError', async () => {
			Router.state = { mode: 'text', path: 'about/cv' };
			const callback = vi.fn();
			Router.onStateChange = callback;

			await expect(Router.go('text', 'about/cv', '#invalid%2Ghash')).resolves.not.toThrow();
		});
	});
});
