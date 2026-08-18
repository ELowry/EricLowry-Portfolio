import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TextRenderer } from './textRenderer.js';
import { Content } from '../content/content.js';
import { Router } from '../core/router.js';

vi.mock('./lang.js', () => {
	return {
		Lang: {
			getString: vi.fn((key, data, fallback) => {
				return fallback;
			}),
			getHtmlString: vi.fn((key, data, fallback) => {
				return fallback;
			}),
		},
	};
});

vi.mock('../content/content.js', () => {
	return {
		Content: {
			findNodeByPath: vi.fn(),
		},
	};
});

vi.mock('../content/blog.js', () => {
	return {
		Blog: {
			getIndex: vi.fn().mockResolvedValue([]),
			injectComments: vi.fn(),
		},
	};
});

describe('TextRenderer', () => {
	let appMock;
	let textNavContainer;
	let breadcrumbTemplate;
	let navLinkTemplate;
	let textRenderer;

	beforeEach(() => {
		vi.restoreAllMocks();

		Router.state = { mode: 'game', path: '' };

		textNavContainer = document.createElement('div');
		textNavContainer.id = 'text-nav';

		breadcrumbTemplate = document.createElement('template');
		breadcrumbTemplate.id = 'template-breadcrumb';
		breadcrumbTemplate.innerHTML = '<li><a href="#"></a></li>';

		navLinkTemplate = document.createElement('template');
		navLinkTemplate.id = 'template-nav-link';
		navLinkTemplate.innerHTML = '<div><a href="#"></a></div>';

		appMock = {
			mode: 'text',
			navigate: vi.fn(),
			uiManager: {
				elements: {
					textNav: textNavContainer,
				},
			},
		};

		textRenderer = new TextRenderer(appMock, breadcrumbTemplate, navLinkTemplate);
	});

	it('should render breadcrumbs successfully for a path with translated aria-labels', () => {
		const nodeMock = { id: 'cv', title: 'CV', children: [] };
		Content.findNodeByPath.mockImplementation((p) => {
			if (p === '') {
				return { id: 'root', children: [] };
			}
			return nodeMock;
		});

		textRenderer.render('about/cv', nodeMock);

		const list = textNavContainer.querySelector('ol.breadcrumbs');
		expect(list).not.toBeNull();
		expect(list.getAttribute('aria-label')).toBe('Breadcrumb');

		const crumbs = list.querySelectorAll('li');
		expect(crumbs.length).toBe(3);
	});

	it('should render category children items with translated aria-labels', () => {
		const childNode = { id: 'cv', title: 'CV', type: 'content' };
		const categoryNode = {
			id: 'about',
			title: 'About',
			type: 'category',
			children: [childNode],
		};

		Content.findNodeByPath.mockImplementation((p) => {
			if (p === '') {
				return { id: 'root', children: [] };
			}
			return categoryNode;
		});

		textRenderer.render('about', categoryNode);

		const navList = textNavContainer.querySelector('.nav-list');
		expect(navList).not.toBeNull();
		expect(navList.getAttribute('aria-label')).toBe('Category options');

		const links = navList.querySelectorAll('a');
		expect(links.length).toBe(1);
	});

	it('should render breadcrumbs correctly for dynamic blog paths without a node', () => {
		Content.findNodeByPath.mockReturnValue(null);
		Router.state = { mode: 'text', path: 'blog/2026-05-30' };

		textRenderer.render('blog/2026-05-30', null);

		const list = textNavContainer.querySelector('ol.breadcrumbs');
		expect(list).not.toBeNull();

		const crumbs = list.querySelectorAll('li');
		expect(crumbs.length).toBe(3);

		const blogLink = crumbs[1].querySelector('a');
		expect(blogLink.getAttribute('href')).toBe('/blog');

		const navList = textNavContainer.querySelector('.nav-list');
		expect(navList).toBeNull();
	});
});
