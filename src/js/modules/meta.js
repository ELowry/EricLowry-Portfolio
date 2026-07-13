import { Events } from './events.js';
import { Router } from './router.js';
import { Lang } from './lang.js';
import { Blog } from './blog.js';

/**
 * MetaController manages page metadata, updating document title, descriptions, and Open Graph tags.
 */
class MetaController {
	/** @type {Node[]} */
	#originalOgNodes = [];

	/** @type {boolean} */
	#hasOverriddenMeta = false;

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
		let pageDescription = null;
		let pageImage = '';
		let pageImageAlt = '';
		let imgWidth = '1200';
		let imgHeight = '630';

		if (Router.isBlogRoute && path.startsWith('blog/')) {
			const date = path.substring(5);
			try {
				const blogIndex = await Blog.getIndex();
				const entry = blogIndex.find((e) => e.date === date);

				if (entry) {
					pageTitle = entry.title;
					pageImageAlt = entry.title; // Blog images are generated using the title
					if (entry.description) {
						pageDescription = entry.description;
					}
					const datePath = entry.date.replace(/-/g, '');
					pageImage = `/assets/images/blog/${datePath}/poster.png`;
				}
			} catch (error) {
				console.error('Failed to get blog entry title:', error);
			}
		} else if (path === 'blog') {
			pageTitle = Lang.getString('blog.title', null, 'Blog');
			pageImageAlt = pageTitle;
		} else if (path !== '' && path !== 'index.html') {
			const pathKey = path.replace(/\//g, '.');
			const titleKey = `content.${pathKey}.title`;
			const descKey = `content.${pathKey}.description`;
			const altKey = `content.${pathKey}.imageAlt`;

			let effectiveNode =
				node.type == 'content'
					? node
					: node.children?.find((child) => child.id === node.id) || node;

			pageTitle = Lang.getString(
				titleKey,
				null,
				effectiveNode ? effectiveNode.title : path.split('/').pop()
			);
			pageDescription = Lang.getString(descKey, null, null);
			pageImageAlt = Lang.getString(altKey, null, pageTitle);

			if (effectiveNode && effectiveNode.image) {
				pageImage = `/assets/images/${effectiveNode.image}`;

				if (effectiveNode.image.includes('__')) {
					const extensionIndex = effectiveNode.image.lastIndexOf('.');
					const withoutExtension =
						extensionIndex !== -1
							? effectiveNode.image.substring(0, extensionIndex)
							: effectiveNode.image;

					const parts = withoutExtension.split('__');
					if (parts.length > 1) {
						const variantSizes = parts.slice(1).join('__');
						const lastUnderscoreIndex = variantSizes.lastIndexOf('_');

						const fullSize =
							lastUnderscoreIndex !== -1
								? variantSizes.substring(lastUnderscoreIndex + 1)
								: variantSizes;

						const dimensions = fullSize.split('-');
						if (dimensions.length >= 2) {
							imgWidth = dimensions[0];
							imgHeight = dimensions[1];
						}
					}
				}
			}
		}

		this.#updateTitle(pageTitle);
		this.#updateDescription(pageDescription);
		this.#updateImage(pageImage, pageImageAlt, imgWidth, imgHeight);
	}

	/**
	 * Updates the document and Open Graph titles.
	 * @param {string} pageTitle - The specific page title, if any.
	 * @private
	 */
	#updateTitle(pageTitle) {
		const siteName = Lang.getString('meta.title', null, 'Eric Lowry – Portfolio');

		const ogSiteName = document.querySelector('meta[property="og:site_name"]');
		if (ogSiteName) {
			ogSiteName.setAttribute('content', siteName);
		}

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
	}

	/**
	 * Updates the document and Open Graph descriptions.
	 * @param {string|null} pageDescription - The specific page description, if any.
	 * @private
	 */
	#updateDescription(pageDescription) {
		const defaultDesc = Lang.getString(
			'meta.description',
			null,
			'Systems-driven UX/UI designer and entrepreneur with 10+ years of experience. Specializing in Unity3D immersive training, environment design, and interactive tech.'
		);
		const finalDesc = pageDescription || defaultDesc;

		const descMeta = document.querySelector('meta[name="description"]');
		if (descMeta) {
			descMeta.setAttribute('content', finalDesc);
		}

		const ogDescMeta = document.querySelector('meta[property="og:description"]');
		if (ogDescMeta) {
			ogDescMeta.setAttribute('content', finalDesc);
		}
	}

	/**
	 * Updates the Open Graph image tags with a single, highly-compatible fallback image.
	 * @param {string} pageImage - The relative path to the image, if any.
	 * @param {string} pageImageAlt - The localized alt text for the image.
	 * @param {string} width - The parsed width of the image.
	 * @param {string} height - The parsed height of the image.
	 * @private
	 */
	#updateImage(pageImage, pageImageAlt, width, height) {
		if (pageImage) {
			const imageUrl = `${window.location.origin}${pageImage}`;

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

			let mimeType = 'image/jpeg';
			if (pageImage.endsWith('.png')) {
				mimeType = 'image/png';
			} else if (pageImage.endsWith('.gif')) {
				mimeType = 'image/gif';
			}

			head.appendChild(createMeta('og:image', imageUrl));
			head.appendChild(createMeta('og:image:type', mimeType));
			head.appendChild(createMeta('og:image:width', width));
			head.appendChild(createMeta('og:image:height', height));
			head.appendChild(createMeta('og:image:alt', pageImageAlt || 'Portfolio image'));

			this.#hasOverriddenMeta = true;
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
