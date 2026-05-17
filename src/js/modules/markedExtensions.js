import { App } from '../app.js';
import { Obfuscator } from './obfuscator.js';
import { Gallery } from './gallery.js';
import { LocalLinkParser } from './localLinks.js';
import { VideoEmbeds } from './embeds.js';

/**
 * Manages custom extensions and renderers for the `marked` library.
 */
export class MarkedExtensions {
	/**
	 * @param {Object} marked - The marked library instance.
	 */
	constructor(marked) {
		/** @type {Object} Reference to the marked library instance */
		this.marked = marked;
	}

	/**
	 * Configuration for the `marked-gfm-heading-id` extension.
	 * @constant {Object}
	 */
	static get HEADING_ID_CONFIG() {
		return { prefix: '_' };
	}

	/**
	 * Configuration for the `marked-alert` extension.
	 * @constant {Object}
	 */
	static get ALERT_CONFIG() {
		return {
			variants: [
				{
					type: 'info',
					title: 'Info',
					icon: '<svg class="octicon octicon-info mr-2" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>',
				},
				{
					type: 'summary',
					title: 'Summary',
					icon: '',
				},
			],
		};
	}

	/**
	 * Configuration for the `marked-responsive-images` extension.
	 * @constant {Object}
	 */
	static get RESPONSIVE_IMAGES_CONFIG() {
		return {
			debug: App.isLocal,
			sizes: '(max-width: 820px) 95vw, 820px',
			class: 'md-img',
			decoding: 'async',
		};
	}

	/**
	 * Initializes and applies the custom extensions to the marked instance.
	 */
	setup() {
		// Strip HTML comments
		this.marked.use({
			walkTokens(token) {
				if (token.type === 'html') {
					token.text = token.text.replace(/<!--[\s\S]*?-->/g, '');
				}
			},
		});

		// Heading IDs
		if (typeof window.markedGfmHeadingId !== 'undefined') {
			const headingIdExtension =
				typeof window.markedGfmHeadingId === 'function'
					? window.markedGfmHeadingId
					: window.markedGfmHeadingId.gfmHeadingId;
			if (headingIdExtension) {
				this.marked.use(headingIdExtension(MarkedExtensions.HEADING_ID_CONFIG));
			}
		}

		// Text Obfuscation
		this.marked.use(Obfuscator.getMarkedExtension());
		// Local Link Rewriting
		this.marked.use(LocalLinkParser.getMarkedExtension());
		// Video Embeds
		this.marked.use(VideoEmbeds.getMarkedExtension());
		// Gallery
		this.marked.use(Gallery.getMarkedExtension());

		// Alerts
		if (typeof window.markedAlert !== 'undefined') {
			const alertExtension =
				typeof window.markedAlert === 'function'
					? window.markedAlert
					: window.markedAlert.markedAlert;
			if (alertExtension) {
				this.marked.use(alertExtension(MarkedExtensions.ALERT_CONFIG));
			}
		}

		// Responsive Images
		if (typeof window.markedResponsiveImages !== 'undefined') {
			const responsiveImagesExtension =
				typeof window.markedResponsiveImages === 'function'
					? window.markedResponsiveImages
					: window.markedResponsiveImages.markedResponsiveImages;

			if (responsiveImagesExtension) {
				this.marked.use(
					responsiveImagesExtension(MarkedExtensions.RESPONSIVE_IMAGES_CONFIG)
				);
			}
		}
	}
}
