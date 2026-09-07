import { getCacheBuster } from '../core/sharedUtils.js';

/**
 * Manages project data fetching and caching; is the centralized way to access the projects index.
 */
class ProjectsController {
	/**
	 * The cached index of project entries
	 * @type {Array<Object>|null}
	 */
	#indexCache = null;

	/**
	 *  Pending fetch request promise.  
	 * Used to deduplicate concurrent requests.
	 * @type {Promise<Array<Object>>|null}
	 */
	#fetchPromise = null;

	/**
	 * @returns {boolean} Whether the index is currently cached.
	 */
	get isCached() {
		return this.#indexCache !== null;
	}

	/**
	 * @param {string} cacheBuster - Cache buster value.
	 * @returns {string} the local path to the projects index JSON.
	 * @private
	 */
	static #getProjectsIndexFilePath(cacheBuster) {
		return `/content/projects-index.json?v=${cacheBuster}`;
	}

	/**
	 * Perform the fetch operation.
	 * @param {AbortSignal} [abortSignal=undefined] - Signal to cancel the fetch request.
	 * @returns {Promise<Array<Object>>} the projects index data promise.
	 * @private
	 */
	async #fetchIndexData(abortSignal) {
		try {
			const response = await fetch(
				ProjectsController.#getProjectsIndexFilePath(getCacheBuster()),
				{
					signal: abortSignal,
				}
			);

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
	 * Fetches the projects index JSON
	 * Concurrent calls share a promise to avoid multiple network requests.
	 * @param {AbortSignal} [abortSignal] - Signal to cancel the request.
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
