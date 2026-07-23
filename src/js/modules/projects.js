/**
 * ProjectsController manages the fetching and caching of GitHub project data.
 * It provides a centralized way to access the projects index.
 */
class ProjectsController {
	/** @type {Object[]|null} */
	#indexCache = null;

	/** @type {Promise<Object[]>|null} */
	#fetchPromise = null;

	/**
	 * Fetches the projects index JSON and caches it.
	 * Concurrent calls will share the same promise to prevent multiple network requests.
	 * @returns {Promise<Object[]>} The parsed projects index.
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
	 * @returns {Promise<Object[]>} The projects index data.
	 * @private
	 */
	async #fetchIndexData() {
		try {
			const cacheBuster = window.__CACHE_BUSTER__ || Date.now();
			const response = await fetch(`/content/projects-index.json?v=${cacheBuster}`);

			if (!response.ok) {
				throw new Error(`Failed to load projects index: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('ProjectsController: Error fetching projects index:', error);
			throw error;
		}
	}
}

export const Projects = new ProjectsController();
