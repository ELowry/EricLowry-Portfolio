import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TextRenderer } from './textRenderer.js';
import { Content } from './content.js';

vi.mock('./lang.js', () => {
	return {
		Lang: {
			getString: vi.fn((key, data, fallback) => {
				return fallback;
			}),
		},
	};
});

vi.mock('./content.js', () => {
	return {
		Content: {
			findNodeByPath: vi.fn(),
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

	it('should render breadcrumbs successfully for a path', () => {
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

		const crumbs = list.querySelectorAll('li');
		expect(crumbs.length).toBe(3);
	});

	it('should render category children items', () => {
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

		const links = navList.querySelectorAll('a');
		expect(links.length).toBe(1);
	});
});
