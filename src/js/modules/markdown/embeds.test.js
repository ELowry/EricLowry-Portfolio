import { describe, expect, it } from 'vitest';

import { VideoEmbeds } from './embeds.js';

describe('VideoEmbeds Marked Extension', () => {
	const extension = VideoEmbeds.getMarkedExtension();
	const linkRenderer = extension.renderer.link;

	it('should return valid marked.js configuration objects', () => {
		expect(extension).toHaveProperty('renderer');
		expect(typeof linkRenderer).toBe('function');
	});

	it('should return false for links that do not match video embed base URLs', () => {
		const regularLinkToken = {
			href: 'https://example.com/some-video',
			title: 'Regular Link',
			text: 'Watch Video',
		};

		const result = linkRenderer(regularLinkToken);
		expect(result).toBe(false);
	});

	it('should render iframe elements for matching spectra video links', () => {
		const embedLinkToken = {
			href: 'https://spectra.video/videos/embed/12345',
			title: 'Spectra Embed',
			text: 'A video',
		};

		const result = linkRenderer(embedLinkToken);

		expect(typeof result).toBe('string');
		expect(result).toContain('iframe');
		expect(result).toContain('src="https://spectra.video/videos/embed/12345"');
		expect(result).toContain('allow="fullscreen"');
		expect(result).toContain('padding-top: 56.25%');
	});

	it('should extract custom aspect ratio parameters from the URL query', () => {
		const embedWithAspectToken = {
			href: 'https://spectra.video/videos/embed/12345?aspect=75',
			title: 'Aspect Custom',
			text: 'Aspect 75',
		};

		const result = linkRenderer(embedWithAspectToken);

		expect(result).toContain('padding-top: 75%');
		expect(result).not.toContain('aspect=75');
	});
});
