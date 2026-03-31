import { App } from '../app.js';
import { Router } from './router.js';
import { Content } from './content.js';

/**
 * Intercepts markdown links pointing to local content files and rewrites them to match the application routing system.
 */
export class LocalLinkParser {
	/**
	 * Regular expression to match and extract the logical path from a localized content file URL.  
	 * Matches paths like `/content/en_US/about/cv.md` and extracts `about/cv`.
	 * @returns {RegExp}
	 * @constant
	 */
	static get CONTENT_LINK_REGEX() {
		return /^\/?content\/[^/]+\/(.*?)\.md$/i;
	}

	/**
	 * Generates the marked.js extension configuration object for parsing links.
	 * @returns {Object}
	 */
	static getMarkedExtension() {
		return {
			renderer: {
				/**
				 * Custom renderer for links to intercept content paths.
				 * @param {Object} token - The marked token for the link.
				 * @returns {string|boolean} The rendered HTML for the link, or false to fall back to default rendering.
				 */
				link(token) {
					const { href, title, text } = token;

					if (!href) {
						return false;
					}

					const match = href.match(LocalLinkParser.CONTENT_LINK_REGEX);

					if (match) {
						const file = match[1] + '.md';
						const paths = Content.findPathsByFile(file);

						let contentPath = match[1];

						// If there are multiple paths (shared content), try to stay in current branch context, or default to the first one found.
						if (paths.length > 0) {
							const currentPath = Router.currentPath;
							const contextMatch = paths.find((p) => p.startsWith(currentPath));
							contentPath = contextMatch || paths[0];
						}

						const titleAttr = title ? ` title="${title}"` : '';

						return `<a href="/${App.mode}/${contentPath}"${titleAttr} onclick="event.preventDefault(); App.navigate('${contentPath}');">${text}</a>`;
					}

					// External links
					if (href.startsWith('http') || href.startsWith('//')) {
						const titleAttr = title ? ` title="${title}"` : '';
						return `<a href="${href}"${titleAttr} class="md-external-link" target="_blank" rel="noopener noreferrer">${text}</a>`;
					}

					return false;
				},
			},
		};
	}
}
