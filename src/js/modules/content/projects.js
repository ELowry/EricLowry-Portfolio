import { getCacheBuster } from '../core/sharedUtils.js';

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
	 * @returns {boolean} Whether the index is currently cached.
	 */
	get isCached() {
		return this.#indexCache !== null;
	}

	/**
	 * Internal method to perform the fetch operation.
	 * @param {AbortSignal} [abortSignal] - Optional abort signal to cancel the request.
	 * @returns {Promise<Object[]>} The projects index data.
	 * @private
	 */
	async #fetchIndexData(abortSignal) {
		try {
			const response = await fetch(`/content/projects-index.json?v=${getCacheBuster()}`, {
				signal: abortSignal,
			});

			if (!response.ok) {
				throw new Error(`Failed to load projects index: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('ProjectsController: Error fetching projects index:', error);
			}
			throw error;
		}
	}

	/**
	 * Fetches the projects index JSON and caches it.
	 * Concurrent calls will share the same promise to prevent multiple network requests.
	 * @param {AbortSignal} [abortSignal] - Optional abort signal to cancel the request.
	 * @returns {Promise<Object[]>} The parsed projects index.
	 */
	async getIndex(abortSignal) {
		if (this.#indexCache) {
			return this.#indexCache;
		}

		if (!this.#fetchPromise) {
			this.#fetchPromise = this.#fetchIndexData(abortSignal)
				.then((data) => {
					this.#indexCache = data;
					return data;
				})
				.catch((error) => {
					this.#fetchPromise = null;
					throw error;
				});
		}

		return this.#fetchPromise;
	}
}

export const Projects = new ProjectsController();
