/**
 * Parses an image string to find the optimal variant for Open Graph tags.
 * Seeks the smallest image that is at least 1200x630, preferring standard formats over WebP.
 * @param {string} imageStr - The raw image filename string.
 * @returns {Object} an object containing the formatted url, width, and height.
 */
export function parseImageVariant(imageStr) {
	let imgWidth = '1200';
	let imgHeight = '630';
	let finalImageUrl = `/assets/images/${imageStr}`;

	if (imageStr.includes('__')) {
		const extensionIndex = imageStr.lastIndexOf('.');
		const originalExt = extensionIndex !== -1 ? imageStr.substring(extensionIndex) : '';
		const withoutExtension =
			extensionIndex !== -1 ? imageStr.substring(0, extensionIndex) : imageStr;

		const parts = withoutExtension.split('__');

		if (parts.length > 1) {
			const base = parts[0];
			const variantSizes = parts.slice(1).join('__');
			const tokens = variantSizes.split('_');

			const parsedTokens = tokens.map((token) => {
				const tokenParts = token.split('-');
				return {
					token: token,
					w: parseInt(tokenParts[0], 10),
					h: parseInt(tokenParts[1], 10),
					isWebp: token.includes('-webp'),
				};
			});

			parsedTokens.sort((a, b) => {
				return a.w - b.w;
			});

			const maxAvailableW = parsedTokens[parsedTokens.length - 1].w;

			let validTokens = parsedTokens.filter((t) => {
				return t.w >= 1200 && t.h >= 630;
			});

			if (validTokens.length === 0) {
				validTokens = parsedTokens.filter((t) => {
					return t.w === maxAvailableW;
				});
			}

			const bestToken =
				validTokens.find((t) => {
					return !t.isWebp;
				}) || validTokens[0];

			if (!bestToken.isWebp && bestToken.w === maxAvailableW) {
				// The largest fallback image always uses the full tokenized filename
				finalImageUrl = `/assets/images/${imageStr}`;
			} else {
				// All other variants (and all WebPs) use the short token name
				let sExt = originalExt;
				if (bestToken.isWebp) {
					sExt = '.webp';
				}
				finalImageUrl = `/assets/images/${base}__${bestToken.token}${sExt}`;
			}

			imgWidth = bestToken.w.toString();
			imgHeight = bestToken.h.toString();
		}
	}

	return { url: finalImageUrl, width: imgWidth, height: imgHeight };
}

/**
 * Resolves a dot-notation path against a data object.
 * @param {string} pathString - Dot-separated path to the target value.
 * @param {Object} dataObject - The object to search within.
 * @param {string} fallback - The value to return if the path is not found.
 * @returns {any} the resolved value or the fallback.
 */
export function resolveDotPath(pathString, dataObject, fallback) {
	if (!dataObject) {
		return fallback;
	}

	const path = pathString.split('.');
	let target = dataObject;

	for (let i = 0; i < path.length; i++) {
		const key = path[i];
		if (!target || !Object.prototype.hasOwnProperty.call(target, key)) {
			return fallback;
		}
		target = target[key];
	}

	return target;
}

/**
 * Sanitizes a URL path by removing duplicate slashes, leading/trailing slashes, and index.html.
 * @param {string} path - Raw path to sanitize.
 * @returns {string} a clean path.
 */
export function sanitizePath(path) {
	if (!path) {
		return '';
	}

	let cleanPath = path
		.replace(/\/+/g, '/')
		.replace(/^\/|\/$/g, '')
		.trim();

	if (cleanPath.endsWith('/index.html')) {
		cleanPath = cleanPath.slice(0, -11);
	} else if (cleanPath === 'index.html') {
		cleanPath = '';
	}

	return cleanPath;
}

/**
 * Escapes unsafe characters for HTML attributes.
 * @param {string} str - The string to escape.
 * @returns {string} The HTML-safe string.
 */
export function escapeHtml(str) {
	if (!str) {
		return '';
	}

	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/**
 * Returns a centralized cache-busting query string.
 * Uses a static build hash in production, or Date.now() for local development.
 * @returns {string} The cache buster string (e.g., "?v=1a2b3c" or "?v=1710923019230")
 */
export function getCacheBuster() {
	if (import.meta.env.DEV) {
		if (!window.__CACHE_BUSTER__) {
			window.__CACHE_BUSTER__ = Date.now();
		}
		return window.__CACHE_BUSTER__;
	}

	if (typeof __BUILD_HASH__ !== 'undefined') {
		return __BUILD_HASH__;
	}

	return '';
}

/**
 * Safely decodes a URL hash and scrolls the target element into view.
 * @param {string} hash - The URL hash (e.g., '#my-id').
 * @param {HTMLElement|null} [container=null] - Optional container the target must be inside.
 * @param {ScrollBehavior} [behavior='smooth'] - The scroll behavior ('smooth', 'auto', 'instant').
 */
export function scrollToHash(hash, container = null, behavior = 'smooth') {
	if (!hash) {
		return;
	}

	let id = hash.substring(1);
	try {
		id = decodeURIComponent(id);
	} catch {
		// Malformed URI
	}

	const targetEl = document.getElementById(id);

	if (targetEl) {
		if (!container || container.contains(targetEl)) {
			targetEl.scrollIntoView({ behavior, block: 'start' });
		}
	}
}
