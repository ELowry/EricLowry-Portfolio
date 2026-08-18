import { Router } from '../core/router.js';
import { Content } from '../content/content.js';

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
	 * Builds an internal application link HTML string from a matched content file regex and hash.
	 * @param {RegExpMatchArray} match - The regex match result against CONTENT_LINK_REGEX.
	 * @param {string} hash - The URL hash fragment (e.g., `#heading`).
	 * @param {string} innerHtml - The parsed inner HTML/text of the link.
	 * @param {string} [title=''] - Optional title attribute.
	 * @returns {string|boolean} The rendered anchor tag string, or false if the path cannot be resolved.
	 */
	static buildInternalLink(match, hash, innerHtml, title = '') {
		const logicalPath = match[1];
		const file = logicalPath + '.md';

		if (logicalPath.startsWith('blog/') || logicalPath.startsWith('projects/')) {
			const titleAttr = title ? ` title="${title}"` : '';
			const hrefPath = `/${Router.currentMode}/${logicalPath}${hash}`;

			return `<a href="${hrefPath}"${titleAttr} data-preview-path="${logicalPath}" onclick="event.preventDefault(); App.navigate('${logicalPath}${hash}');">${innerHtml}</a>`;
		}

		const paths = Content.findPathsByFile(file);

		if (paths.length === 0) {
			return false;
		}

		const currentPath = Router.currentPath;
		const contextMatch = paths.find((p) => p.startsWith(currentPath));
		let contentPath = contextMatch || paths[0];

		let urlPath = contentPath;
		const segments = contentPath.split('/');
		const lastSegment = segments[segments.length - 1];

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
			? `/${Router.currentMode}/${urlPath}${hash}`
			: `/${Router.currentMode}/${hash}`;

		return `<a href="${hrefPath}"${titleAttr} data-preview-path="${contentPath}" onclick="event.preventDefault(); App.navigate('${contentPath}${hash}');">${innerHtml}</a>`;
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
					const { href, title, text, tokens } = token;

					if (!href) {
						return false;
					}

					let innerHtml = text;
					if (this?.parser && typeof this.parser.parseInline === 'function' && tokens) {
						innerHtml = this.parser.parseInline(tokens);
					}

					const hashIndex = href.indexOf('#');
					const cleanHref = hashIndex !== -1 ? href.substring(0, hashIndex) : href;
					const hash = hashIndex !== -1 ? href.substring(hashIndex) : '';

					const match = cleanHref.match(LocalLinkParser.CONTENT_LINK_REGEX);
					if (match) {
						return LocalLinkParser.buildInternalLink(match, hash, innerHtml, title);
					}

					// External links
					if (href.startsWith('http') || href.startsWith('//')) {
						const titleAttr = title ? ` title="${title}"` : '';
						const classAttr = innerHtml.includes('<img')
							? ''
							: ' class="md-external-link"';
						return `<a href="${href}"${titleAttr}${classAttr} target="_blank" rel="noopener noreferrer">${innerHtml}</a>`;
					}

					return false;
				},
			},
		};
	}
}
