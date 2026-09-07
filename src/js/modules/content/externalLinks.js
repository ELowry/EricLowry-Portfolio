import { getCacheBuster } from '../core/sharedUtils.js';

/**
 * Manages fetching and caching external link metadata.
 */
class ExternalLinksController {
	/**
	 * Cached JSON representation of all the site's external links.
	 * @type {Object|null}
	 */
	#dataCache = null;

	/**
	 * Resolves with the cached data.
	 * @type {Promise<Object>|null}
	 */
	#fetchPromise = null;

	/**
	 * @returns {string} the location of the file in which to store fetched links.
	 * @constant
	 */
	static get CACHE_FILE_LOCATION() {
		return '/assets/external-links.json';
	}

	/**
	 * Fetches and caches external links JSON.
	 * @returns {Promise<Object>} The parsed external links dictionary.
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
	 * Performs the fetch operation.
	 * @returns {Promise<Object>} The external links data.
	 * @private
	 */
	async #fetchData() {
		try {
			const response = await fetch(
				`${ExternalLinksController.CACHE_FILE_LOCATION}?v=${getCacheBuster()}`
			);

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
