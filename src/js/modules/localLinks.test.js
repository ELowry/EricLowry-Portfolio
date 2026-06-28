import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalLinkParser } from './localLinks.js';
import { Content } from './content.js';
import { Router } from './router.js';

vi.mock('./content.js', () => {
	return {
		Content: {
			findPathsByFile: vi.fn(),
		},
	};
});

vi.mock('./router.js', () => {
	return {
		Router: {
			currentPath: '',
		},
	};
});

vi.mock('../app.js', () => {
	return {
		App: {
			mode: 'text',
		},
	};
});

describe('LocalLinkParser Marked Extension', () => {
	const extension = LocalLinkParser.getMarkedExtension();
	const linkRenderer = extension.renderer.link;

	beforeEach(() => {
		vi.restoreAllMocks();
		Router.currentPath = '';
	});

	it('should parse internal content paths and rewrite them to navigate via App', () => {
		Content.findPathsByFile.mockReturnValue(['about/cv']);
		const token = {
			href: '/content/en_US/about/cv.md',
			title: 'My CV',
			text: 'Curriculum Vitae',
		};

		const result = linkRenderer(token);

		expect(result).toContain('href="/text/about/cv"');
		expect(result).toContain('onclick="event.preventDefault(); App.navigate(\'about/cv\');"');
		expect(result).toContain('title="My CV"');
	});

	it('should parse internal content paths with hash fragments and preserve the anchor', () => {
		Content.findPathsByFile.mockReturnValue(['about/cv']);
		const token = {
			href: '/content/en_US/about/cv.md#my-anchor',
			text: 'Curriculum Vitae with Anchor',
		};

		const result = linkRenderer(token);

		expect(result).toContain('href="/text/about/cv#my-anchor"');
		expect(result).toContain(
			'onclick="event.preventDefault(); App.navigate(\'about/cv#my-anchor\');"'
		);
	});

	it('should resolve and clean index files to point to their parent folder', () => {
		Content.findPathsByFile.mockReturnValue(['about/about']);
		const token = {
			href: '/content/en_US/about/about.md',
			title: 'About',
			text: 'About Me',
		};

		const result = linkRenderer(token);

		expect(result).toContain('href="/text/about/"');
	});

	it('should resolve deep literal index files to point to their parent folder', () => {
		Content.findPathsByFile.mockReturnValue(['websites/lightweight-static/index']);
		const token = {
			href: '/content/en_US/websites/lightweight-static/index.md',
			title: 'Overview',
			text: 'Overview',
		};

		const result = linkRenderer(token);

		expect(result).toContain('href="/text/websites/lightweight-static/"');
	});

	it('should rewrite external links to securely open in a new tab', () => {
		const token = {
			href: 'https://github.com',
			title: 'GitHub',
			text: 'GitHub Repository',
		};

		const result = linkRenderer(token);

		expect(result).toContain('target="_blank"');
		expect(result).toContain('rel="noopener noreferrer"');
		expect(result).toContain('class="md-external-link"');
	});

	it('should fallback to default rendering for unrecognized internal files', () => {
		Content.findPathsByFile.mockReturnValue([]);
		const token = {
			href: '/content/en_US/unknown.md',
			text: 'Missing Page',
		};

		const result = linkRenderer(token);

		expect(result).toBe(false);
	});
});
