/**
 * BlogController manages the fetching and caching of blog data.
 * It provides a centralized way to access the blog index.
 */
class BlogController {
	/** @type {Object[]|null} */
	#indexCache = null;

	/** @type {Promise<Object[]>|null} */
	#fetchPromise = null;

	/**
	 * Fetches the blog index JSON and caches it.
	 * Concurrent calls will share the same promise to prevent multiple network requests.
	 * @returns {Promise<Object[]>} The parsed blog index.
	 */
	async getIndex() {
		if (this.#indexCache) {
			return this.#indexCache;
		}

		if (!this.#fetchPromise) {
			this.#fetchPromise = this.#fetchIndexData().then((data) => {
				this.#indexCache = data;
				return data;
			});
		}

		return this.#fetchPromise;
	}

	/**
	 * Internal method to perform the fetch operation.
	 * @returns {Promise<Object[]>} The blog index data.
	 * @private
	 */
	async #fetchIndexData() {
		try {
			const cacheBuster = window.__CACHE_BUSTER__ || Date.now();
			const response = await fetch(`/content/blog-index.json?v=${cacheBuster}`);

			if (!response.ok) {
				throw new Error(`Failed to load blog index: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('BlogController: Error fetching blog index:', error);
			throw error;
		}
	}
}

export const Blog = new BlogController();
