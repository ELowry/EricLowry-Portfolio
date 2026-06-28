import { App } from '../app.js';
import { Router } from './router.js';
import { Content } from './content.js';

/**
 * Intercepts markdown links pointing to local content files and rewrites them to match the application routing system.
 */
export class LocalLinkParser {
	/**
	 * Matches paths like `/content/en_US/about/cv.md` and extracts `about/cv`.
	 * @returns {RegExp} a regular expression to match and extract the logical path from a localized content file URL.
	 * @constant
	 */
	static get CONTENT_LINK_REGEX() {
		return /^\/?content\/[^/]+\/(.*?)\.md$/i;
	}

	/**
	 * Generates the marked.js extension configuration object for parsing links.
	 * @returns {Object} a marked.js extension configuration object.
	 */
	static getMarkedExtension() {
		return {
			renderer: {
				/**
				 * Custom renderer for links to intercept content paths.
				 * @param {Object} token - The marked token for the link.
				 * @returns {string|boolean} the rendered HTML for the link, or false to fall back to default rendering.
				 */
				link(token) {
					const { href, title, text } = token;

					if (!href) {
						return false;
					}

					const hashIndex = href.indexOf('#');
					const cleanHref = hashIndex !== -1 ? href.substring(0, hashIndex) : href;
					const hash = hashIndex !== -1 ? href.substring(hashIndex) : '';

					const match = cleanHref.match(LocalLinkParser.CONTENT_LINK_REGEX);

					if (match) {
						const file = match[1] + '.md';
						const paths = Content.findPathsByFile(file);

						if (paths.length === 0) {
							return false;
						}

						// If there are multiple paths (shared content), try to stay in current branch context, or default to the first one found.
						const currentPath = Router.currentPath;
						const contextMatch = paths.find((p) => p.startsWith(currentPath));
						let contentPath = contextMatch || paths[0];

						let urlPath = contentPath;
						const segments = contentPath.split('/');
						const lastSegment = segments[segments.length - 1];

						// Handle 'index' files where the name matches the parent directory or is literally 'index'
						if (segments.length > 1 && lastSegment === segments[segments.length - 2]) {
							segments.pop();
							contentPath = segments.join('/');
							urlPath = contentPath + '/';
						} else if (lastSegment === 'index') {
							segments.pop();
							contentPath = segments.join('/');
							urlPath = contentPath ? contentPath + '/' : '';
						}

						const titleAttr = title ? ` title="${title}"` : '';
						const hrefPath = urlPath
							? `/${App.mode}/${urlPath}${hash}`
							: `/${App.mode}/${hash}`;

						return `<a href="${hrefPath}"${titleAttr} onclick="event.preventDefault(); App.navigate('${contentPath}${hash}');">${text}</a>`;
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
