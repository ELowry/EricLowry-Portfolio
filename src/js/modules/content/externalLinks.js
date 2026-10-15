import { getCacheBuster } from '../core/sharedUtils.js';

/**
 * @typedef {Object} ExternalLinkMetadata
 * @property {string} title - The fetched title of the external page.
 * @property {string|null} description - The Open Graph description.
 * @property {string|null} image - The local path to the cached Open Graph image.
 * @property {string|null} imageAlt - The alt text for the preview image.
 * @property {string|null} hash - The MD5 hash of the data (used by the build script).
 * @property {string|null} etag - The server's ETag for caching.
 * @property {string|null} lastModified - The server's Last-Modified date.
 */

/**
 * ExternalLinksController manages the fetching and caching of external link metadata.
 */
class ExternalLinksController {
	/** @type {Object<string, ExternalLinkMetadata>|null} */
	#dataCache = null;

	/** @type {Promise<Object<string, ExternalLinkMetadata>>|null} */
	#fetchPromise = null;

	/**
	 * Fetches the external links JSON and caches it.
	 * @returns {Promise<Object<string, ExternalLinkMetadata>>} The parsed external links dictionary.
	 */
	async getData() {
		if (this.#dataCache) {
			return this.#dataCache;
		}

		if (!this.#fetchPromise) {
			this.#fetchPromise = this.#fetchData().then((data) => {
				this.#dataCache = data;
				return data;
			});
		}

		return this.#fetchPromise;
	}

	/**
	 * Internal method to perform the fetch operation.
	 * @returns {Promise<Object<string, ExternalLinkMetadata>>} The external links data.
	 * @private
	 */
	async #fetchData() {
		try {
			const response = await fetch(`/assets/external-links.json?v=${getCacheBuster()}`);

			if (!response.ok) {
				throw new Error(`Failed to load external links: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('ExternalLinksController: Error fetching external links:', error);
			return {};
		}
	}
}

export const ExternalLinks = new ExternalLinksController();
