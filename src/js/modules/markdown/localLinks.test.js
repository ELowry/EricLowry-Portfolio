import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalLinkParser } from './localLinks.js';
import { Content } from '../content/content.js';
import { Router } from '../core/router.js';

vi.mock('../content/content.js', () => {
	return {
		Content: {
			findPathsByFile: vi.fn(),
		},
	};
});

vi.mock('../core/router.js', () => {
	return {
		Router: { currentPath: '', currentMode: 'text' },
	};
});

vi.mock('../../app.js', () => {
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

	it('should parse project routes directly without looking up in ContentTree', () => {
		const token = {
			href: '/content/en_US/projects/DNSToggle.md',
			text: 'DNS Toggle',
		};

		const result = linkRenderer(token);

		expect(result).toContain('href="/text/projects/DNSToggle"');
		expect(result).toContain(
			'onclick="event.preventDefault(); App.navigate(\'projects/DNSToggle\');"'
		);
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

	it('should omit external link indicator if inner content contains an image tag', () => {
		const token = {
			href: 'https://github.com/ELowry/DNSToggle',
			text: '<img src="badge.svg" alt="Badge">',
		};

		const result = linkRenderer(token);

		expect(result).not.toContain('class="md-external-link"');
	});

	it('should support inline parser when called within marked context', () => {
		const mockContext = {
			parser: {
				parseInline: vi.fn().mockReturnValue('Parsed Inline Text'),
			},
		};

		const token = {
			href: 'https://github.com',
			tokens: [{ type: 'text', text: 'Raw Text' }],
			text: 'Raw Text',
		};

		const result = linkRenderer.call(mockContext, token);

		expect(mockContext.parser.parseInline).toHaveBeenCalledWith(token.tokens);
		expect(result).toContain('Parsed Inline Text');
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
