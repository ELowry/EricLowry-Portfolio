/**
 * Detects specific video embed links and transforms them into responsive iframes.
 */
export class VideoEmbeds {
	/**
	 * List of base URLs allowed to be transformed into embeds.
	 * @returns {string[]} an array of base URLs allowed to be transformed into embeds.
	 * @constant
	 */
	static get BASE_URLS() {
		return ['https://spectra.video/videos/embed/'];
	}

	/**
	 * Default padding-top (aspect ratio) for embeds if not specified.
	 * @returns {string} the default padding-top value.
	 * @constant
	 */
	static get DEFAULT_ASPECT() {
		return '56.25%';
	}

	/**
	 * Generates the marked.js extension configuration object for transforming embed links.
	 * @returns {Object} the marked.js extension configuration object.
	 */
	static getMarkedExtension() {
		return {
			renderer: {
				/**
				 * Custom renderer for links to transform specific embed URLs into iframes.
				 * @param {Object} token - The marked token for the link.
				 * @returns {string|boolean} the rendered HTML for the iframe, or false to fall back to default rendering.
				 */
				link(token) {
					const { href, title, text } = token;

					if (!href) {
						return false;
					}

					const isEmbedMatch = VideoEmbeds.BASE_URLS.some((baseUrl) => {
						return href.startsWith(baseUrl);
					});

					if (isEmbedMatch) {
						let aspect = VideoEmbeds.DEFAULT_ASPECT;
						let cleanHref = href;

						try {
							const url = new URL(href);
							if (url.searchParams.has('aspect')) {
								aspect = url.searchParams.get('aspect');

								// Ensure it has a unit if it's just a number
								if (
									!aspect.endsWith('%')
									&& !aspect.endsWith('px')
									&& !isNaN(aspect)
								) {
									aspect += '%';
								}

								url.searchParams.delete('aspect');
								cleanHref = url.toString();
							}
						} catch (e) {
							// If URL is malformed, fall back to default
							return false;
						}

						const titleAttr = title
							? ` title="${title}"`
							: ` title="${text || 'Video player'}"`;

						return `<div class="embed-container" style="padding-top: ${aspect};"><iframe ${titleAttr} src="${cleanHref}" allow="fullscreen"></iframe></div>`;
					}

					return false;
				},
			},
		};
	}
}
