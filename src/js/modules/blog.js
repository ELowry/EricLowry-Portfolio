import { Lang } from './lang.js';

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
			commentsContainer.innerHTML = `<p>${Lang.getString(
				'blog.loadingComments',
				null,
				'Loading comments…'
			)}</p>`;

			// Load Giscus
			await import('giscus');

			const themeUrl = new URL(giscusThemePath, window.location.origin).href;

			commentsContainer.innerHTML = `
				<h2 id="Comments">${Lang.getString('blog.commentsTitle', null, 'Comments')}</h2>
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
			// Render consent UI
			const consentText = Lang.getString(
				'blog.commentsConsent',
				null,
				'This site uses Giscus (powered by GitHub Discussions) to host comments. Loading comments will connect to GitHub.'
			);
			const btnText = Lang.getString('blog.loadComments', null, 'Load Comments');

			commentsContainer.innerHTML = `
				<div class="giscus-consent-box" style="display: flex; flex-direction: column; margin-bottom: 2rem;">
					<h2 id="Comments">${Lang.getString('blog.commentsTitle', null, 'Comments')}</h2>
					<div class="markdown-alert markdown-alert-warning">
						<p class="markdown-alert-title"><svg class="octicon octicon-alert mr-2" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>Warning</p>
						<p>${consentText}</p>
					</div>
					<button id="load-comments-btn" style="--color-accent: var(--color-alert-warning)">${btnText}</button>
				</div>
			`;

			commentsContainer.querySelector('#load-comments-btn').addEventListener('click', () => {
				localStorage.setItem(consentKey, 'true');
				renderGiscus();
			});
		}
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
