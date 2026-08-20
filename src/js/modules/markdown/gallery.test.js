import { describe, expect, it } from 'vitest';

import { Gallery } from './gallery.js';

describe('Gallery Marked Extension', () => {
	const extension = Gallery.getMarkedExtension();
	const tableRenderer = extension.renderer.table;

	it('should return valid marked.js configuration objects', () => {
		expect(extension).toHaveProperty('renderer');
		expect(typeof extension.renderer.table).toBe('function');
	});

	it('should return false for tables that do not have a gallery trigger keyword', () => {
		const regularTableToken = {
			header: [{ text: 'Standard Header' }, { text: 'Another Column' }],
			rows: [],
		};

		const result = tableRenderer.call({}, regularTableToken);
		expect(result).toBe(false);
	});

	it('should render a gallery structure when the trigger keyword is present', () => {
		const galleryTableToken = {
			header: [{ text: 'Gallery:' }],
			rows: [
				[
					{
						tokens: [
							{
								type: 'image',
								href: 'image1.jpg',
								text: 'Alt Text 1',
								title: 'Title 1',
							},
						],
					},
				],
			],
		};

		const mockContext = {
			parser: {
				parseInline: (tokens) =>
					`<img src="${tokens[0].href}" alt="${tokens[0].text}" title="${tokens[0].title}" />`,
			},
		};

		const result = tableRenderer.call(mockContext, galleryTableToken);

		expect(typeof result).toBe('string');
		expect(result).toContain(Gallery.DEFAULT_GALLERY_CLASS);
		expect(result).toContain(Gallery.DEFAULT_ACCORDION_CLASS);
		expect(result).toContain(Gallery.DEFAULT_ITEM_CLASS);
		expect(result).toContain('src="image1.jpg"');
		expect(result).toContain('alt="Alt Text 1"');
	});

	it('should respect custom class configuration options', () => {
		const customOptions = {
			galleryClass: 'custom-gallery',
			accordionClass: 'custom-accordion',
			itemClass: 'custom-item',
			triggerKeywords: { TestGallery: { accordion: true } },
		};
		const customExtension = Gallery.getMarkedExtension(customOptions);
		const customRenderer = customExtension.renderer.table;

		const token = {
			header: [{ text: 'TestGallery' }],
			rows: [[{ tokens: [{ type: 'image', href: 'test.jpg', text: 'test' }] }]],
		};

		const result = customRenderer.call({}, token);

		expect(result).toContain('custom-gallery custom-accordion');
		expect(result).toContain('custom-item');
	});
});
