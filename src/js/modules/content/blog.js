import giscusThemePath from '../../../css/giscus.css?url';
import { escapeHtml, getCacheBuster } from '../core/sharedUtils.js';
import { Lang } from '../ui/lang.js';

/**
 * Manages blog data fetching and caching; is the centralized way to access the blog index.
 */
class BlogController {
	/**
	 * The cached index of blog entries.
	 * @type {Array<Object>|null}
	 * @private
	 */
	#indexCache = null;

	/**
	 * Pending fetch request promise.  
	 * Used to deduplicate concurrent requests.
	 * @type {Promise<Array<Object>>|null}
	 * @private
	 */
	#fetchPromise = null;

	/**
	 * @returns {boolean} Whether the index is currently cached.
	 */
	get isCached() {
		return this.#indexCache !== null;
	}

	/**
	 * Get the blog index file path.
	 * @param {string} cacheBuster - Cache buster value.
	 * @returns {string} the local path to the blog index JSON.
	 * @private
	 */
	static #getBlogIndexFilePath(cacheBuster) {
		return `/content/blog-index.json?v=${cacheBuster}`;
	}

	/**
	 * Get the giscus HTML code (https://github.com/giscus/giscus/blob/main/ADVANCED-USAGE.md#isetconfigmessage).
	 * @param {string} term - Giscus discussion term.
	 * @param {string} themeUrl - Giscus theme URL.
	 * @param {string} languageCode - Giscus widget language code.
	 * @returns {string} the configured Giscus HTML code.
	 */
	static #getGiscusConfig(term, themeUrl, languageCode) {
		return `
			<hr />
			<h2 id="Comments">${Lang.getHtmlString('blog.commentsTitle', { fallback: 'Comments' })}</h2>
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
					lang="${languageCode}"
					loading="lazy"
				></giscus-widget>
			</div>
		`;
	}

	/**
	 * Perform the fetch operation.
	 * @param {AbortSignal} [abortSignal=undefined] - Signal to cancel the fetch request.
	 * @returns {Promise<Array<Object>>} the blog index data promise.
	 * @private
	 */
	async #fetchIndexData(abortSignal) {
		try {
			const response = await fetch(BlogController.#getBlogIndexFilePath(getCacheBuster()), {
				signal: abortSignal,
			});

			if (!response.ok) {
				throw new Error(`Failed to load blog index: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('BlogController: Error fetching blog index:', error);
			}
			throw error;
		}
	}

	/**
	 * Fetch and cache the blog index JSON.  
	 * Concurrent calls share a promise to avoid multiple network requests.
	 * @param {AbortSignal} [abortSignal=undefined] - Signal to cancel the request.
	 * @returns {Promise<Array<Object>>} The parsed blog index.
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

	/**
	 * Injects a Giscus comment widget at the end of the provided container.  
	 * Requires user concent to load.
	 * @param {HTMLElement} container - The parent container.
	 * @param {string} term - The Giscus discussion term (https://github.com/giscus/giscus/blob/main/ADVANCED-USAGE.md#isetconfigmessage).
	 * @param {string} language - The blog post's language code.
	 */
	async injectComments(container, term, language) {
		const consentKey = 'giscusConsent';
		const hasConsent = localStorage.getItem(consentKey) === 'true';

		const commentsContainer = document.createElement('section');
		commentsContainer.className = 'blog-comments-section';
		container.appendChild(commentsContainer);

		/**
		 * Renders the Giscus widget.
		 */
		const renderGiscus = async () => {
			// Show a loading state while fetching Giscus
			commentsContainer.innerHTML = `<p>${Lang.getHtmlString('blog.loadingComments', { fallback: 'Loading comments…' })}</p>`;

			// Load Giscus
			await import('giscus');

			const themeUrl = new URL(giscusThemePath, window.location.origin).href;
			const escapedTerm = escapeHtml(term);
			const escapedLang = escapeHtml(language.substring(0, 2));

			commentsContainer.innerHTML = BlogController.#getGiscusConfig(
				escapedTerm,
				themeUrl,
				escapedLang
			);
		};

		if (hasConsent) {
			renderGiscus();
		} else {
			// Render consent UI via HTML template
			const template = document.getElementById('template-giscus-consent');

			if (template) {
				const templateClone = template.content.cloneNode(true);

				// Automatic translation pass
				Lang.performTranslation(templateClone);

				const loadButton = templateClone.querySelector('#load-comments-btn');
				if (loadButton) {
					loadButton.addEventListener('click', () => {
						localStorage.setItem(consentKey, 'true');
						renderGiscus();
					});
				}

				commentsContainer.appendChild(templateClone);
			} else {
				console.error('Giscus consent template not found.');
			}
		}
	}
}

export const Blog = new BlogController();
