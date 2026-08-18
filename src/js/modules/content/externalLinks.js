import { getCacheBuster } from '../core/sharedUtils.js';

/**
 * ExternalLinksController manages the fetching and caching of external link metadata.
 */
class ExternalLinksController {
	/** @type {Object|null} */
	#dataCache = null;

	/** @type {Promise<Object>|null} */
	#fetchPromise = null;

	/**
	 * Fetches the external links JSON and caches it.
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
	 * Internal method to perform the fetch operation.
	 * @returns {Promise<Object>} The external links data.
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
