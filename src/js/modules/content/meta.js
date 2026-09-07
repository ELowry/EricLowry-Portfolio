import { Events } from '../core/events.js';
import { parseImageVariant } from '../core/sharedUtils.js';
import { Lang } from '../ui/lang.js';
import { Blog } from './blog.js';
import { Content } from './content.js';
import { Projects } from './projects.js';

/** @typedef {import('./contentTree.js').ContentNode} ContentNode */

/**
 * @typedef {Object} PageMetadata
 * @property {string} pageTitle - The title text.
 * @property {string|null} pageDescription - The meta description.
 * @property {string} pageImage - Path to the full-size OG preview image.
 * @property {string} pageImageAlt - Alt text for the OG preview image.
 * @property {string} previewImage - Path to the image used in UI preview cards.
 * @property {string} imgWidth - (px) OG preview image width.
 * @property {string} imgHeight - (px) OG preview image height.
 * @property {string} markdownUrl - Path to the underlying markdown content file.
 */

/**
 * Manages page metadata.  
 * Updates document titles, descriptions, and Open Graph tags.
 *
 * Provides metadata retrieval for UI preview cards.
 */
class MetaController {
	/**
	 * Node list of the existing Open Graph image tags.
	 * @type {Node[]}
	 * @private
	 */
	#originalOgNodes = [];

	/**
	 * Whether the meta tags have been overridden.
	 * @type {boolean}
	 * @private
	 */
	#hasOverriddenMeta = false;

	/**
	 * @returns {string} "1200"
	 * @constant
	 */
	static get DEFAULT_IMAGE_WIDTH() {
		return '1200';
	}

	/**
	 * @returns {string} "630"
	 * @constant
	 */
	static get DEFAULT_IMAGE_HEIGHT() {
		return '630';
	}

	/**
	 * @returns {string} the default page title.
	 * @constant
	 */
	static get DEFAULT_META_TITLE() {
		return 'Eric Lowry';
	}

	/**
	 * @returns {string} the suffix to append to all page titles
	 * @constant
	 */
	static get META_TITLE_SUFFIX() {
		return ' – Eric Lowry';
	}

	/**
	 * @returns {string} the default page description.
	 * @constant
	 */
	static get DEFAULT_META_DESCRIPTION() {
		return 'Systems-driven UX/UI designer and entrepreneur with 10+ years of experience. Specializing in Unity3D immersive training, environment design, and interactive tech.';
	}

	/**
	 * @returns {string} job title for JSON-LD.
	 * @constant
	 */
	static get JSONLD_JOB_TITLE() {
		return 'Systems-driven UX/UI Designer & Entrepreneur';
	}

	/**
	 * @returns {string} the image path for the person entity in JSON-LD.
	 * @constant
	 */
	static get JSONLD_IMAGE_PATH() {
		return '/assets/images/eric_lowry_portrait__240-240.webp';
	}

	/**
	 * @returns {Array<string>} list of social profile URLs for JSON-LD.
	 * @constant
	 */
	static get JSONLD_SAME_AS() {
		return ['https://github.com/ELowry'];
	}

	/**
	 * @returns {string} description for llms.txt in JSON-LD.
	 * @constant
	 */
	static get LLMS_TXT_DESCRIPTION() {
		return 'A comprehensive index of portfolio content optimized for Large Language Models.';
	}

	/**
	 * Blog markdown file path template.
	 * @param {string} lang - Language code.
	 * @param {string} date - Blog post date.
	 * @returns {string} the full local path to the markdown file.
	 * @private
	 */
	static #getBlogMarkdownPath(lang, date) {
		return `/content/${lang}/blog/${date}.md`;
	}

	/**
	 * Blog poster image path template.
	 * @param {string} datePath - Blog post date without dashes.
	 * @returns {string} the full local path to the image file.
	 * @private
	 */
	static #getBlogImagePath(datePath) {
		return `/assets/images/blog/${datePath}/poster.jpg`;
	}

	/**
	 * Project markdown file path template.
	 * @param {string} lang - Language code.
	 * @param {string} projectId - Project ID (GitHub url ID).
	 * @returns {string} the full local path to the markdown file.
	 * @private
	 */
	static #getProjectMarkdownPath(lang, projectId) {
		return `/content/${lang}/projects/${projectId}.md`;
	}

	/**
	 * Project preview image path template.
	 * @param {string} projectId - Project ID (GitHub url ID).
	 * @returns {string} the full local path to the image file.
	 * @private
	 */
	static #getProjectImagePath(projectId) {
		return `/assets/images/projects/${projectId}/poster.jpg`;
	}

	/**
	 *` llms.txt` JSON-LD reference.
	 * @param {string} origin - `window.location.origin`.
	 * @returns {Object} JSON-LD representation of the `llms.txt`.
	 * @private
	 */
	static #getLlmsTxtJsonLd(origin) {
		return {
			'@type': 'CreativeWork',
			name: 'Machine-readable index (llms.txt)',
			description: MetaController.LLMS_TXT_DESCRIPTION,
			encodingFormat: 'text/markdown',
			url: `${origin}/llms.txt`,
		};
	}

	/**
	 * Raw markdown JSON-LD reference.
	 * @param {string} origin - `window.location.origin`.
	 * @param {string} markdownUrl - Path to the underlying markdown content file.
	 * @returns {Object} JSON-LD representation of the markdown content file.
	 * @private
	 */
	static #getMarkdownSourceJsonLd(origin, markdownUrl) {
		return {
			'@type': 'CreativeWork',
			name: 'Raw Markdown source',
			description: 'The raw markdown content source for this page.',
			encodingFormat: 'text/markdown',
			url: `${origin}${markdownUrl}`,
		};
	}

	/**
	 * Person reference for JSON-LD.
	 * @param {string} origin - `window.location.origin`.
	 * @returns {Object} JSON-LD representation of "moi".
	 * @private
	 */
	static #getPersonJsonLd(origin) {
		return {
			'@type': 'Person',
			'@id': `${origin}/#person`,
			name: MetaController.DEFAULT_META_TITLE,
			jobTitle: MetaController.JSONLD_JOB_TITLE,
			url: `${origin}/`,
			image: `${origin}${MetaController.JSONLD_IMAGE_PATH}`,
			sameAs: MetaController.JSONLD_SAME_AS,
		};
	}

	/**
	 * Generates a default page metadata structure.
	 * @returns {PageMetadata} a metadata object.
	 * @private
	 */
	static #getDefaultMeta() {
		return {
			pageTitle: '',
			pageDescription: null,
			pageImage: '',
			pageImageAlt: '',
			previewImage: '',
			imgWidth: MetaController.DEFAULT_IMAGE_WIDTH,
			imgHeight: MetaController.DEFAULT_IMAGE_HEIGHT,
			markdownUrl: '',
		};
	}

	constructor() {
		this.#originalOgNodes = Array.from(
			document.querySelectorAll('meta[property^="og:image"]')
		).map((el) => {
			return el.cloneNode(true);
		});

		Events.subscribe('route:changed', (payload) => {
			this.update(payload);
		});

		Events.subscribe('lang:changed', () => {
			this.#updateLanguageTags();
		});
	}

	/**
	 * Retrieves blog route metadata (blog index or individual posts).
	 * @param {string} path - Path to the blog route.
	 * @returns {Promise<PageMetadata>} the formatted metadata.
	 * @private
	 */
	async #getBlogMeta(path) {
		const meta = MetaController.#getDefaultMeta();

		if (path === 'blog') {
			meta.pageTitle = Lang.getString('content.blog.title', { fallback: null });
			meta.pageDescription = Lang.getString('content.blog.description', { fallback: null });
		} else if (path.startsWith('blog/')) {
			const date = path.substring(5);
			try {
				const blogIndex = await Blog.getIndex();
				const blogPost = blogIndex.find((x) => x.date === date);

				if (blogPost) {
					meta.pageTitle = blogPost.title;
					meta.pageImageAlt = blogPost.title;
					if (blogPost.description) {
						meta.pageDescription = blogPost.description;
					}
					meta.pageImage = MetaController.#getBlogImagePath(
						blogPost.date.replace(/-/g, '')
					);
					meta.previewImage = meta.pageImage;

					const lang = blogPost.language || Lang.langCode || 'en_US';
					meta.markdownUrl = MetaController.#getBlogMarkdownPath(lang, date);
				}
			} catch (error) {
				console.error('MetaController: Failed to get blog entry title:', error);
			}
		}

		return meta;
	}

	/**
	 * Retrieves metadata for project routes (project index and individual single projects).
	 * @param {string} path - Path to the project route.
	 * @returns {Promise<PageMetadata>} the formatted metadata.
	 * @private
	 */
	async #getProjectMeta(path) {
		const meta = MetaController.#getDefaultMeta();

		if (path === 'projects') {
			meta.pageTitle = Lang.getString('content.projects.title', { fallback: 'Projects' });
			meta.pageDescription = Lang.getString('content.projects.description', {
				fallback: null,
			});
		} else if (path.startsWith('projects/')) {
			const repoName = path.substring(9);
			try {
				const projectIndex = await Projects.getIndex();
				const project = projectIndex.find((x) => x.id === repoName);

				if (project) {
					meta.pageTitle = project.title;
					meta.pageImageAlt = project.title;
					if (project.description) {
						meta.pageDescription = project.description;
					}

					meta.pageImage = MetaController.#getProjectImagePath(project.id);
					meta.previewImage = meta.pageImage;

					meta.imgWidth = project.ogImageWidth || MetaController.DEFAULT_IMAGE_WIDTH;
					meta.imgHeight = project.ogImageHeight || MetaController.DEFAULT_IMAGE_HEIGHT;

					const lang = Lang.langCode || 'en_US';
					meta.markdownUrl = MetaController.#getProjectMarkdownPath(lang, project.id);
				}
			} catch (error) {
				console.error('MetaController: Failed to get project title:', error);
			}
		}

		return meta;
	}

	/**
	 * Retrieves tree node and standard page metadata.
	 * @param {string} path - Path to the content.
	 * @param {ContentNode|null} [node=null] - Pre-resolved content node.
	 * @returns {PageMetadata} the formatted metadata.
	 * @private
	 */
	#getStandardMeta(path, node = null) {
		const meta = MetaController.#getDefaultMeta();

		if (path === '' || path === 'index.html') {
			meta.markdownUrl = `/content/${Lang.langCode || 'en_US'}/index.md`;
			return meta;
		}

		const pathKey = path.replace(/\//g, '.');
		const titleKey = `content.${pathKey}.title`;
		const descKey = `content.${pathKey}.description`;
		const altKey = `content.${pathKey}.imageAlt`;

		const targetNode = node || Content.findNodeByPath(path);

		let effectiveNode = null;
		if (targetNode) {
			effectiveNode =
				targetNode.type === 'content'
					? targetNode
					: targetNode.children?.find((x) => x.id === targetNode.id) || targetNode;
		}

		meta.pageTitle = Lang.getString(titleKey, {
			fallback: effectiveNode ? effectiveNode.title : path.split('/').pop() || '',
		});
		meta.pageDescription = Lang.getString(descKey, { fallback: null });

		if (effectiveNode && effectiveNode.file) {
			meta.markdownUrl = `/content/${Lang.langCode || 'en_US'}/${effectiveNode.file}`;
		}

		if (effectiveNode && effectiveNode.image) {
			meta.pageImageAlt = Lang.getString(altKey, { fallback: meta.pageTitle });
			meta.pageImage = `/assets/images/${effectiveNode.image}`;

			const parsedImg = parseImageVariant(effectiveNode.image);
			meta.previewImage = parsedImg.url;
			meta.imgWidth = parsedImg.width;
			meta.imgHeight = parsedImg.height;
		}

		return meta;
	}

	/**
	 * Updates the document title and Open Graph title.
	 * @param {string|null} [pageTitle=null] - The page title.
	 * @private
	 */
	#updateTitle(pageTitle = null) {
		const siteName = Lang.getString('meta.title', {
			fallback: MetaController.DEFAULT_META_TITLE,
		});

		const ogSiteName = document.querySelector('meta[property="og:site_name"]');
		if (ogSiteName) {
			ogSiteName.setAttribute('content', siteName);
		}

		if (pageTitle) {
			document.title = `${pageTitle}${MetaController.META_TITLE_SUFFIX}`;
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
	 * Updates the document description and Open Graph description.
	 * @param {string|null} [pageDescription=null] - The page description.
	 * @private
	 */
	#updateDescription(pageDescription = null) {
		const finalDesc =
			pageDescription
			|| Lang.getString('meta.description', {
				fallback: MetaController.DEFAULT_META_DESCRIPTION,
			});

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
	 * Updates the canonical link tag and Open Graph URL tag to the current page URL.
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
	 * Updates the JSON-LD structured data script tag to reflect page metadata.
	 * @param {string} pageTitle - The page title.
	 * @param {string|null} pageDescription - The page description.
	 * @param {string} [markdownUrl=''] - Path to the underlying markdown content file.
	 * @private
	 */
	#updateJsonLd(pageTitle, pageDescription, markdownUrl = '') {
		const currentUrl = `${window.location.origin}${window.location.pathname}`;
		const siteName = Lang.getString('meta.title', {
			fallback: MetaController.DEFAULT_META_TITLE,
		});
		const title = pageTitle ? `${pageTitle}${MetaController.META_TITLE_SUFFIX}` : siteName;

		const description =
			pageDescription
			|| Lang.getString('meta.description', {
				fallback: MetaController.DEFAULT_META_DESCRIPTION,
			});

		let scriptElement = document.querySelector('script[type="application/ld+json"]');

		const subjectOfList = [MetaController.#getLlmsTxtJsonLd(window.location.origin)];
		if (markdownUrl) {
			subjectOfList.push(
				MetaController.#getMarkdownSourceJsonLd(window.location.origin, markdownUrl)
			);
		}

		const jsonLdData = {
			'@context': 'https://schema.org',
			'@graph': [
				MetaController.#getPersonJsonLd(window.location.origin),
				{
					'@type': 'WebPage',
					'@id': `${currentUrl}#webpage`,
					name: title,
					description: description,
					url: currentUrl,
					author: {
						'@id': `${window.location.origin}/#person`,
					},
					subjectOf: subjectOfList,
				},
			],
		};

		if (!scriptElement) {
			scriptElement = document.createElement('script');
			scriptElement.setAttribute('type', 'application/ld+json');
			document.head.appendChild(scriptElement);
		}

		scriptElement.textContent = JSON.stringify(jsonLdData, null, 2);
	}

	/**
	 * Updates the Open Graph image tags.
	 * @param {Object} options - OPTIONS WRAPPER.
	 * @param {string|null} [options.pageImage=null] - Image path.
	 * @param {string|null} [options.pageImageAlt=null] - Image alt text.
	 * @param {string|null} [options.width=null] - Image width.
	 * @param {string|null} [options.height=null] - Image height.
	 * @private
	 */
	#updateImage({ pageImage = null, pageImageAlt = null, width = null, height = null } = {}) {
		if (pageImage || this.#hasOverriddenMeta) {
			const currentOgImageTags = document.querySelectorAll('meta[property^="og:image"]');
			currentOgImageTags.forEach((imageTag) => {
				imageTag.remove();
			});
		}

		if (pageImage) {
			const imageUrl =
				pageImage.startsWith('http://')
				|| pageImage.startsWith('https://')
				|| pageImage.startsWith('//')
					? pageImage
					: `${window.location.origin}${pageImage}`;

			/**
			 * Create a meta tag element.
			 * @param {string} property - The meta tag.
			 * @param {string} content - Its value.
			 * @returns {HTMLMetaElement} the meta element.
			 */
			const createMeta = (property, content) => {
				const meta = document.createElement('meta');
				meta.setAttribute('property', property);
				meta.setAttribute('content', content);
				return meta;
			};

			let mimeType = 'image/jpeg';
			if (pageImage.includes('opengraph.githubassets.com')) {
				mimeType = 'image/png';
			} else {
				const cleanUrl = pageImage.split('?')[0].split('#')[0];
				const lastDotIndex = cleanUrl.lastIndexOf('.');

				if (lastDotIndex !== -1) {
					const ext = cleanUrl.substring(lastDotIndex + 1).toLowerCase();
					switch (ext) {
						case 'png':
							mimeType = 'image/png';
							break;
						case 'gif':
							mimeType = 'image/gif';
							break;
						case 'webp':
							mimeType = 'image/webp';
							break;
						case 'svg':
							mimeType = 'image/svg+xml';
							break;
						default:
							mimeType = 'image/jpeg';
							break;
					}
				}
			}

			document.head.appendChild(createMeta('og:image', imageUrl));
			document.head.appendChild(createMeta('og:image:type', mimeType));
			if (width) {
				document.head.appendChild(createMeta('og:image:width', width));
			}
			if (height) {
				document.head.appendChild(createMeta('og:image:height', height));
			}
			document.head.appendChild(
				createMeta('og:image:alt', pageImageAlt || 'Portfolio image')
			);

			this.#hasOverriddenMeta = true;
		} else if (this.#hasOverriddenMeta) {
			this.#originalOgNodes.forEach((node) => {
				document.head.appendChild(node.cloneNode(true));
			});

			this.#hasOverriddenMeta = false;
		}
	}

	/**
	 * Updates the document's language attributes.
	 * @private
	 */
	#updateLanguageTags() {
		const currentLang = Lang.langCode || 'en_US';
		const shortLang = currentLang.split('_')[0].toLowerCase();

		document.documentElement.setAttribute('lang', shortLang);

		const langMeta = document.querySelector('meta[name="language"]');
		if (langMeta) {
			langMeta.setAttribute('content', shortLang.toUpperCase());
		}

		const ogLocale = document.querySelector('meta[property="og:locale"]');
		if (ogLocale) {
			ogLocale.setAttribute('content', currentLang);
		}
	}

	/**
	 * Updates the document metadata.
	 * @param {{ path: string, node: ContentNode|null }} payload - `route:changed` event payload.
	 * @returns {Promise<void>}
	 */
	async update({ path, node }) {
		const metaData = await this.getMetadataForPath(path, node);
		if (!metaData) {
			return;
		}

		this.#updateTitle(metaData.pageTitle);
		this.#updateDescription(metaData.pageDescription);
		this.#updateCanonical();
		this.#updateJsonLd(metaData.pageTitle, metaData.pageDescription, metaData.markdownUrl);
		this.#updateImage({
			pageImage: metaData.pageImage,
			pageImageAlt: metaData.pageImageAlt,
			width: metaData.imgWidth,
			height: metaData.imgHeight,
		});
		this.#updateLanguageTags();
	}

	/**
	 * Get the metadata for a specific content path.
	 *
	 * @param {string} path - Path to the content.
	 * @param {ContentNode|null} [node=null] - Skip the tree lookup by providing the node data.
	 * @returns {Promise<PageMetadata>} the full page metadata object.
	 */
	async getMetadataForPath(path, node = null) {
		if (path === 'blog' || path.startsWith('blog/')) {
			return this.#getBlogMeta(path);
		}

		if (path === 'projects' || path.startsWith('projects/')) {
			return this.#getProjectMeta(path);
		}

		return this.#getStandardMeta(path, node);
	}
}

export const Meta = new MetaController();
