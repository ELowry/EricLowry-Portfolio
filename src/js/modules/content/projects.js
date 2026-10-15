import { getCacheBuster } from '../core/sharedUtils.js';

/**
 * @typedef {Object} ProjectEntry
 * @property {string} id - The GitHub repository name.
 * @property {string} title - The project title.
 * @property {string} [description] - The project description.
 * @property {string} date - The last updated date (YYYY-MM-DD).
 * @property {string} updatedAt - Full ISO timestamp of the last update.
 * @property {number} stars - GitHub stargazer count.
 * @property {string} tech - The primary language/technology used.
 * @property {string} githubUrl - The absolute URL to the GitHub repository.
 * @property {string} [ogImage] - The local path or external URL for the Open Graph image.
 * @property {number|string} [ogImageWidth] - The pixel width of the Open Graph image.
 * @property {number|string} [ogImageHeight] - The pixel height of the Open Graph image.
 */

/**
 * ProjectsController manages the fetching and caching of GitHub project data.  
 * It provides a centralized way to access the projects index.
 */
class ProjectsController {
	/** @type {ProjectEntry[]|null} */
	#indexCache = null;

	/** @type {Promise<ProjectEntry[]>|null} */
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
	 * @returns {Promise<ProjectEntry[]>} The projects index data.
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
	 * @returns {Promise<ProjectEntry[]>} The parsed projects index.
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
