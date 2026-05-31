import { Events } from './events.js';
import { Router } from './router.js';
import { Lang } from './lang.js';

/**
 * MetaController manages page metadata, updating document title and Open Graph tags.
 */
class MetaController {
	/** @type {Node[]} */
	#originalOgNodes = [];

	/** @type {boolean} */
	#hasOverriddenMeta = false;

	/** @type {Object[]|null} */
	#blogIndexCache = null;

	/**
	 * Constructor for MetaController.
	 */
	constructor() {
		this.#originalOgNodes = Array.from(
			document.querySelectorAll('meta[property^="og:image"]')
		).map((el) => {
			return el.cloneNode(true);
		});

		Events.on('route:changed', (payload) => {
			this.update(payload);
		});
	}

	/**
	 * Updates the document metadata based on the current route.
	 * @param {Object} payload - The route:changed event payload.
	 * @param {string} payload.path - The current route path.
	 * @param {Object|null} payload.node - The current route's node.
	 * @returns {Promise<void>}
	 */
	async update({ path, node }) {
		let pageTitle = '';

		if (Router.isBlogRoute && path.startsWith('blog/')) {
			const date = path.substring(5);
			try {
				if (!this.#blogIndexCache) {
					const cacheBuster = window.__CACHE_BUSTER__ || Date.now();
					const response = await fetch(`/content/blog-index.json?v=${cacheBuster}`);
					if (response.ok) {
						this.#blogIndexCache = await response.json();
					}
				}

				if (this.#blogIndexCache) {
					const currentLang = Lang.langCode || 'en_US';
					const entry =
						this.#blogIndexCache.find((e) => {
							return e.date === date && e.language === currentLang;
						})
						|| this.#blogIndexCache.find((e) => {
							return e.date === date && e.language === 'en_US';
						})
						|| this.#blogIndexCache.find((e) => {
							return e.date === date;
						});

					if (entry) {
						pageTitle = entry.title;
					}
				}
			} catch (error) {
				console.error('Failed to get blog entry title:', error);
			}
		} else if (path === 'blog') {
			pageTitle = Lang.getString('blog.title', null, 'Blog');
		} else if (path !== '' && path !== 'index.html') {
			const langKey = `content.${path.replace(/\//g, '.')}.title`;
			const defaultTitle = node ? node.title : path.split('/').pop();
			pageTitle = Lang.getString(langKey, null, defaultTitle);
		}

		const siteName = Lang.getString('meta.title', null, 'Eric Lowry – Portfolio');

		if (pageTitle) {
			document.title = `${pageTitle} – Eric Lowry`;
			const ogTitle = document.querySelector('meta[property="og:title"]');
			if (ogTitle) {
				ogTitle.setAttribute('content', pageTitle);
			}
		} else {
			document.title = siteName;
			const ogTitle = document.querySelector('meta[property="og:title"]');
			if (ogTitle) {
				ogTitle.setAttribute('content', siteName);
			}
		}

		if (Router.isBlogRoute && path.startsWith('blog/')) {
			const date = path.substring(5);
			if (this.#blogIndexCache) {
				const currentLang = Lang.langCode || 'en_US';
				const entry =
					this.#blogIndexCache.find((e) => {
						return e.date === date && e.language === currentLang;
					})
					|| this.#blogIndexCache.find((e) => {
						return e.date === date && e.language === 'en_US';
					})
					|| this.#blogIndexCache.find((e) => {
						return e.date === date;
					});

				if (entry) {
					const datePath = entry.date.replace(/-/g, '');
					const imagePath = `/assets/images/blog/${datePath}/poster_${entry.language}.png`;
					const imageUrl = `${window.location.origin}${imagePath}`;

					const currentOgTags = document.querySelectorAll('meta[property^="og:image"]');
					currentOgTags.forEach((el) => {
						el.remove();
					});

					const head = document.head;
					const createMeta = (property, content) => {
						const meta = document.createElement('meta');
						meta.setAttribute('property', property);
						meta.setAttribute('content', content);
						return meta;
					};

					head.appendChild(createMeta('og:image', imageUrl));
					head.appendChild(createMeta('og:image:type', 'image/png'));
					head.appendChild(createMeta('og:image:width', '1200'));
					head.appendChild(createMeta('og:image:height', '630'));
					head.appendChild(createMeta('og:image:alt', entry.title));

					this.#hasOverriddenMeta = true;
				}
			}
		} else if (this.#hasOverriddenMeta) {
			const currentOgTags = document.querySelectorAll('meta[property^="og:image"]');
			currentOgTags.forEach((el) => {
				el.remove();
			});

			const head = document.head;
			this.#originalOgNodes.forEach((node) => {
				head.appendChild(node.cloneNode(true));
			});

			this.#hasOverriddenMeta = false;
		}
	}
}

export const Meta = new MetaController();
