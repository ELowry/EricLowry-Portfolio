import { Events } from './events.js';
import { Router } from './router.js';
import { Lang } from './lang.js';
import { Blog } from './blog.js';
import { Content } from './content.js';

/**
 * MetaController manages page metadata, updating document title, descriptions, and Open Graph tags.
 * Also provides metadata retrieval for UI preview cards.
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
		const metaData = await this.getMetadataForPath(path, node);
		if (!metaData) return;

		this.#updateTitle(metaData.pageTitle);
		this.#updateDescription(metaData.pageDescription);
		this.#updateCanonical();
		this.#updateJsonLd(metaData.pageTitle, metaData.pageDescription, metaData.markdownUrl);
		this.#updateImage(
			metaData.pageImage,
			metaData.pageImageAlt,
			metaData.imgWidth,
			metaData.imgHeight
		);
	}

	/**
	 * Retrieves formatted metadata for a given content path.
	 *
	 * @param {string} path - The route path to look up.
	 * @param {Object|null} [node=null] - Optional node to skip the tree lookup if already known.
	 * @returns {Promise<Object>} An object containing the page title, description, and image data.
	 */
	async getMetadataForPath(path, node = null) {
		let pageTitle = '';
		let pageDescription = null;
		let pageImage = '';
		let previewImage = '';
		let pageImageAlt = '';
		let imgWidth = '1200';
		let imgHeight = '630';
		let markdownUrl = '';

		if (Router.isBlogRoute && path.startsWith('blog/')) {
			const date = path.substring(5);
			try {
				const blogIndex = await Blog.getIndex();
				const entry = blogIndex.find((e) => e.date === date);

				if (entry) {
					pageTitle = entry.title;
					pageImageAlt = entry.title;
					if (entry.description) {
						pageDescription = entry.description;
					}
					const datePath = entry.date.replace(/-/g, '');
					pageImage = `/assets/images/blog/${datePath}/poster.png`;
					previewImage = pageImage;

					const lang = entry.language || Lang.langCode || 'en_US';
					markdownUrl = `/content/${lang}/blog/${date}.md`;
				}
			} catch (error) {
				console.error('Failed to get blog entry title:', error);
			}
		} else if (path === 'blog') {
			pageTitle = Lang.getString('content.blog.title', null, null);
			pageDescription = Lang.getString('content.blog.description', null, null);
		} else if (path !== '' && path !== 'index.html') {
			const pathKey = path.replace(/\//g, '.');
			const titleKey = `content.${pathKey}.title`;
			const descKey = `content.${pathKey}.description`;
			const altKey = `content.${pathKey}.imageAlt`;

			let targetNode = node || Content.findNodeByPath(path);

			let effectiveNode = null;
			if (targetNode) {
				effectiveNode =
					targetNode.type === 'content'
						? targetNode
						: targetNode.children?.find((child) => child.id === targetNode.id)
							|| targetNode;
			}

			pageTitle = Lang.getString(
				titleKey,
				null,
				effectiveNode ? effectiveNode.title : path.split('/').pop()
			);
			pageDescription = Lang.getString(descKey, null, null);

			if (effectiveNode && effectiveNode.file) {
				markdownUrl = `/content/${Lang.langCode || 'en_US'}/${effectiveNode.file}`;
			}

			if (effectiveNode && effectiveNode.image) {
				pageImageAlt = Lang.getString(altKey, null, pageTitle);
				pageImage = `/assets/images/${effectiveNode.image}`;
				previewImage = pageImage; // Default fallback

				if (effectiveNode.image.includes('__')) {
					const extensionIndex = effectiveNode.image.lastIndexOf('.');
					const originalExt =
						extensionIndex !== -1 ? effectiveNode.image.substring(extensionIndex) : '';
					const withoutExtension =
						extensionIndex !== -1
							? effectiveNode.image.substring(0, extensionIndex)
							: effectiveNode.image;

					const parts = withoutExtension.split('__');
					if (parts.length > 1) {
						const base = parts[0];
						const variantSizes = parts.slice(1).join('__');
						const tokens = variantSizes.split('_');

						// Largest Variant
						const lastToken = tokens[tokens.length - 1];
						const lastDimensions = lastToken.split('-');
						if (lastDimensions.length >= 2) {
							imgWidth = lastDimensions[0];
							imgHeight = lastDimensions[1];
						}

						// Smallest Variant
						const firstParts = tokens[0].split('-');
						const sWidth = firstParts[0];
						const sHeight = firstParts[1];

						// Prioritize webp for smallest variant
						const smallestTokens = tokens.filter((t) =>
							t.startsWith(`${sWidth}-${sHeight}`)
						);
						const webpToken = smallestTokens.find((t) => t.includes('-webp'));
						const bestToken = webpToken || smallestTokens[0];
						const bestParts = bestToken.split('-');

						let sExt = originalExt;
						if (bestParts.length > 2) {
							sExt = `.${bestParts[2]}`;
						}

						previewImage = `/assets/images/${base}__${sWidth}-${sHeight}${sExt}`;
					}
				}
			}
		} else {
			markdownUrl = `/content/${Lang.langCode || 'en_US'}/index.md`;
		}

		return {
			pageTitle,
			pageDescription,
			pageImage,
			previewImage,
			pageImageAlt,
			imgWidth,
			imgHeight,
			markdownUrl,
		};
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
	 * Updates the canonical link tag and Open Graph URL tag to reflect the current page URL.
	 * @private
	 */
	#updateCanonical() {
		const currentUrl = `${window.location.origin}${window.location.pathname}`;

		let canonicalLink = document.querySelector('link[rel="canonical"]');
		if (!canonicalLink) {
			canonicalLink = document.createElement('link');
			canonicalLink.setAttribute('rel', 'canonical');
			document.head.appendChild(canonicalLink);
		}
		canonicalLink.setAttribute('href', currentUrl);

		const ogUrlMeta = document.querySelector('meta[property="og:url"]');
		if (ogUrlMeta) {
			ogUrlMeta.setAttribute('content', currentUrl);
		}
	}

	/**
	 * Updates the JSON-LD structured data script tag to reflect current page title, description, URL, and raw markdown source.
	 * @param {string} pageTitle - The specific page title.
	 * @param {string|null} pageDescription - The specific page description.
	 * @param {string} [markdownUrl=''] - Relative path to the page's raw markdown content.
	 * @private
	 */
	#updateJsonLd(pageTitle, pageDescription, markdownUrl = '') {
		const currentUrl = `${window.location.origin}${window.location.pathname}`;
		const siteName = Lang.getString('meta.title', null, 'Eric Lowry – Portfolio');
		const finalTitle = pageTitle ? `${pageTitle} – Eric Lowry` : siteName;

		const defaultDesc = Lang.getString(
			'meta.description',
			null,
			'Systems-driven UX/UI designer and entrepreneur with 10+ years of experience. Specializing in Unity3D immersive training, spatial logic, and interactive tech.'
		);
		const finalDesc = pageDescription || defaultDesc;

		let scriptEl = document.querySelector('script[type="application/ld+json"]');

		const subjectOfList = [
			{
				'@type': 'CreativeWork',
				name: 'Machine-readable index (llms.txt)',
				description:
					'A comprehensive index of portfolio content optimized for Large Language Models.',
				encodingFormat: 'text/markdown',
				url: `${window.location.origin}/llms.txt`,
			},
		];

		if (markdownUrl) {
			subjectOfList.push({
				'@type': 'CreativeWork',
				name: 'Raw Markdown source',
				description: 'The raw markdown content source for this page.',
				encodingFormat: 'text/markdown',
				url: `${window.location.origin}${markdownUrl}`,
			});
		}

		const jsonLdData = {
			'@context': 'https://schema.org',
			'@graph': [
				{
					'@type': 'Person',
					'@id': `${window.location.origin}/#person`,
					name: 'Eric Lowry',
					jobTitle: 'Systems-driven UX/UI Designer & Entrepreneur',
					url: `${window.location.origin}/`,
					image: `${window.location.origin}/assets/images/eric_lowry_portrait__240-240.webp`,
					sameAs: ['https://github.com/ELowry'],
				},
				{
					'@type': 'WebPage',
					'@id': `${currentUrl}#webpage`,
					name: finalTitle,
					description: finalDesc,
					url: currentUrl,
					author: {
						'@id': `${window.location.origin}/#person`,
					},
					subjectOf: subjectOfList,
				},
			],
		};

		if (!scriptEl) {
			scriptEl = document.createElement('script');
			scriptEl.setAttribute('type', 'application/ld+json');
			document.head.appendChild(scriptEl);
		}

		scriptEl.textContent = JSON.stringify(jsonLdData, null, 2);
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
