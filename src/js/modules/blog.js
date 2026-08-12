import { Lang } from './lang.js';
import { getCacheBuster } from './sharedUtils.js';

import giscusThemePath from '../../css/giscus.css?url';

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
	 * @returns {boolean} Whether the index is currently cached.
	 */
	get isCached() {
		return this.#indexCache !== null;
	}

	/**
	 * Internal method to perform the fetch operation.
	 * @returns {Promise<Object[]>} The blog index data.
	 * @private
	 */
	async #fetchIndexData() {
		try {
			const response = await fetch(`/content/blog-index.json?v=${getCacheBuster()}`);

			if (!response.ok) {
				throw new Error(`Failed to load blog index: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('BlogController: Error fetching blog index:', error);
			throw error;
		}
	}

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
	 * Injects the Giscus comment widget at the end of the provided container.
	 * Checks for user consent before loading third-party scripts.
	 *
	 * @param {HTMLElement} container - The element to append the comments to.
	 * @param {string} term - The Giscus discussion term (e.g., "YYYY-MM-DD - Post Title").
	 * @param {string} language - The language code of the blog post.
	 */
	async injectComments(container, term, language) {
		const consentKey = 'giscusConsent';
		const hasConsent = localStorage.getItem(consentKey) === 'true';

		const commentsContainer = document.createElement('section');
		commentsContainer.className = 'blog-comments-section';
		container.appendChild(commentsContainer);

		const renderGiscus = async () => {
			// Show a loading state while fetching Giscus
			commentsContainer.innerHTML = `<p>${Lang.getHtmlString(
				'blog.loadingComments',
				null,
				'Loading comments…'
			)}</p>`;

			// Load Giscus
			await import('giscus');

			const themeUrl = new URL(giscusThemePath, window.location.origin).href;

			commentsContainer.innerHTML = `
				<hr />
				<h2 id="Comments">${Lang.getHtmlString('blog.commentsTitle', null, 'Comments')}</h2>
				<div style="margin-bottom: 2rem">
					<giscus-widget
						repo="ELowry/EricLowry-Portfolio"
						repoid="R_kgDOQ0_lKQ"
						category="Comments"
						categoryid="DIC_kwDOQ0_lKc4C-Z28"
						mapping="specific"
						term="${term}"
						strict="1"
						reactionsenabled="1"
						emitmetadata="0"
						inputposition="bottom"
						theme="${themeUrl}"
						lang="${language.substring(0, 2)}"
						loading="lazy"
					></giscus-widget>
				</div>
			`;
		};

		if (hasConsent) {
			renderGiscus();
		} else {
			// Render consent UI via HTML template
			const template = document.getElementById('template-giscus-consent');

			if (template) {
				const clone = template.content.cloneNode(true);

				// Automatically populate localized text
				Lang.performTranslation(clone);

				const loadBtn = clone.querySelector('#load-comments-btn');
				if (loadBtn) {
					loadBtn.addEventListener('click', () => {
						localStorage.setItem(consentKey, 'true');
						renderGiscus();
					});
				}

				commentsContainer.appendChild(clone);
			} else {
				console.error('Giscus consent template not found.');
			}
		}
	}
}

export const Blog = new BlogController();
