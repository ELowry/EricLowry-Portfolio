import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	escapeHtml,
	parseImageVariant,
	resolveDotPath,
	sanitizePath,
	scrollToHash,
} from './sharedUtils.js';

describe('sharedUtils', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe('parseImageVariant', () => {
		it('should return the original image if no variant tokens exist', () => {
			const result = parseImageVariant('test-image.jpg');
			expect(result.url).toBe('/assets/images/test-image.jpg');
			expect(result.width).toBe('1200');
			expect(result.height).toBe('630');
		});

		it('should select the smallest variant that meets the 1200x630 threshold', () => {
			const result = parseImageVariant('cover__800-400_1400-700_1920-1080.jpg');
			expect(result.url).toBe('/assets/images/cover__1400-700.jpg');
			expect(result.width).toBe('1400');
			expect(result.height).toBe('700');
		});

		it('should prefer standard formats over WebP if available at the target size', () => {
			const result = parseImageVariant('hero__1400-700-webp_1400-700.png');
			expect(result.url).toBe('/assets/images/hero__1400-700-webp_1400-700.png');
		});

		it('should fallback to the largest available variant if none meet the threshold', () => {
			const result = parseImageVariant('small__400-200_800-400.jpg');
			expect(result.url).toBe('/assets/images/small__400-200_800-400.jpg');
			expect(result.width).toBe('800');
			expect(result.height).toBe('400');
		});
	});

	describe('resolveDotPath', () => {
		const mockData = {
			meta: {
				title: 'Test Title',
				deep: {
					value: 42,
				},
			},
		};

		it('should resolve a valid dot path', () => {
			expect(resolveDotPath('meta.title', mockData, 'fallback')).toBe('Test Title');
			expect(resolveDotPath('meta.deep.value', mockData, 'fallback')).toBe(42);
		});

		it('should return the fallback if the path does not exist', () => {
			expect(resolveDotPath('meta.invalid', mockData, 'fallback')).toBe('fallback');
			expect(resolveDotPath('invalid.path', mockData, 'fallback')).toBe('fallback');
		});

		it('should return the fallback if the data object is null or undefined', () => {
			expect(resolveDotPath('meta.title', null, 'fallback')).toBe('fallback');
		});
	});

	describe('sanitizePath', () => {
		it('should remove duplicate slashes', () => {
			expect(sanitizePath('about//cv///details')).toBe('about/cv/details');
		});

		it('should strip leading and trailing slashes', () => {
			expect(sanitizePath('/projects/')).toBe('projects');
		});

		it('should remove index.html from the path', () => {
			expect(sanitizePath('blog/index.html')).toBe('blog');
			expect(sanitizePath('index.html')).toBe('');
		});
	});

	describe('escapeHtml', () => {
		it('should convert unsafe characters to HTML entities', () => {
			const raw = '<script>alert("XSS & test \'1\'")</script>';
			const safe = escapeHtml(raw);
			expect(safe).toBe(
				'&lt;script&gt;alert(&quot;XSS &amp; test &#039;1&#039;&quot;)&lt;/script&gt;'
			);
		});

		it('should return an empty string for null or undefined input', () => {
			expect(escapeHtml(null)).toBe('');
			expect(escapeHtml(undefined)).toBe('');
		});
	});

	describe('scrollToHash', () => {
		it('should decode the hash and scroll the element into view', () => {
			const scrollIntoViewMock = vi.fn();
			const mockElement = { scrollIntoView: scrollIntoViewMock };
			vi.spyOn(document, 'getElementById').mockReturnValue(mockElement);

			scrollToHash('#target-id');

			expect(document.getElementById).toHaveBeenCalledWith('target-id');
			expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
		});

		it('should not throw if the hash is malformed', () => {
			vi.spyOn(document, 'getElementById').mockReturnValue(null);
			expect(() => {
				return scrollToHash('#invalid%2Ghash');
			}).not.toThrow();
		});

		it('should respect the container constraint if provided', () => {
			const scrollIntoViewMock = vi.fn();
			const mockElement = { scrollIntoView: scrollIntoViewMock };
			const mockContainer = {
				contains: vi.fn().mockReturnValue(false),
			};
			vi.spyOn(document, 'getElementById').mockReturnValue(mockElement);

			scrollToHash('#target-id', mockContainer);

			expect(mockContainer.contains).toHaveBeenCalledWith(mockElement);
			expect(scrollIntoViewMock).not.toHaveBeenCalled();
		});
	});
});
