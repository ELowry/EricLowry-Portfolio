import { Meta } from '../content/meta.js';
import { ExternalLinks } from '../content/externalLinks.js';

/**
 * Manages the generation and display of link preview cards on hover and focus.
 */
export class PreviewManager {
	/** @type {AppController} */
	app;
	/** @type {number|null} */
	hoverTimer;
	/** @type {HTMLElement|null} */
	activeLink;
	/** @type {HTMLElement|null} */
	previewElement;
	/** @type {boolean} */
	supportsAnchor;
	/** @type {number} */
	lastHideTime;

	/**
	 * @param {AppController} app - Reference to the App instance.
	 */
	constructor(app) {
		this.app = app;
		this.hoverTimer = null;
		this.activeLink = null;
		this.previewElement = null;
		this.supportsAnchor =
			CSS.supports('position-anchor', '--foo') || CSS.supports('anchor-name', '--foo');
		this.lastHideTime = 0;

		this.#init();
	}

	/**
	 * The duration of the CSS fade-out transition in milliseconds.
	 * @returns {number} The duration of the CSS fade-out transition in milliseconds.
	 * @constant
	 */
	static get TRANSITION_DURATION() {
		return 300;
	}

	/**
	 * The baseline delay in milliseconds before a preview is shown.
	 * @returns {number} The baseline delay in milliseconds before a preview is shown.
	 * @constant
	 */
	static get HOVER_DELAY() {
		return 140;
	}

	/**
	 * Binds global event listeners for preview triggers.
	 * @private
	 */
	#init() {
		document.addEventListener('mouseover', (e) => this.#handleEnter(e));
		document.addEventListener('mouseout', (e) => this.#handleLeave(e));
		document.addEventListener('focusin', (e) => this.#handleEnter(e));
		document.addEventListener('focusout', (e) => this.#handleLeave(e));

		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && this.previewElement) {
				this.#hidePreview();
			}
		});
	}

	/**
	 * Processes mouseenter and focusin events on valid links.
	 * @param {Event} e - The triggering event.
	 * @private
	 */
	#handleEnter(e) {
		const link = e.target.closest('a[data-preview-path], a.md-external-link');

		if (!link || this.app.Input.lastInputType === 'touch') {
			return;
		}

		if (link.hasAttribute('title')) {
			link.setAttribute('data-original-title', link.getAttribute('title'));
			link.removeAttribute('title');
		}

		this.activeLink = link;

		const timeSinceHide = Date.now() - this.lastHideTime;
		const remainingFade = Math.max(0, PreviewManager.TRANSITION_DURATION - timeSinceHide);
		const delay = Math.max(PreviewManager.HOVER_DELAY, remainingFade);

		clearTimeout(this.hoverTimer);
		this.hoverTimer = setTimeout(() => this.#showPreview(link), delay);
	}

	/**
	 * Processes mouseleave and focusout events on valid links.
	 * @param {Event} e - The triggering event.
	 * @private
	 */
	#handleLeave(e) {
		const link = e.target.closest('a[data-preview-path], a.md-external-link');

		if (!link) {
			return;
		}

		if (link.hasAttribute('data-original-title')) {
			link.setAttribute('title', link.getAttribute('data-original-title'));
			link.removeAttribute('data-original-title');
		}

		if (this.activeLink === link) {
			clearTimeout(this.hoverTimer);
			this.#hidePreview();
			this.activeLink = null;
		}
	}

	/**
	 * Fetches preview metadata for internal and external links.
	 * @param {HTMLElement} link - The target anchor tag.
	 * @returns {Promise<Object|null>} The metadata object, or null if unavailable.
	 * @private
	 */
	async #fetchPreviewData(link) {
		if (link.classList.contains('md-external-link')) {
			const url = link.href;
			const externalData = await ExternalLinks.getData();
			const match = externalData[url];

			if (match && match.title && (match.description || match.image)) {
				return {
					pageTitle: match.title,
					pageDescription: match.description,
					previewImage: match.image,
					pageImageAlt: match.imageAlt || match.title,
				};
			}
			return null;
		}

		const path = link.getAttribute('data-preview-path');
		if (path) {
			const result = await Meta.getMetadataForPath(path);
			if (result.previewImage || result.pageDescription) {
				return result;
			}
			console.warn(`No preview data available for ${path}`);
		}
		return null;
	}

	/**
	 * Ensures the preview card element is instantiated from the DOM template.
	 * @private
	 */
	#ensureTemplateExists() {
		if (this.previewElement) {
			return;
		}

		const template = document.getElementById('template-preview-card');
		if (!template) {
			return;
		}
		const clone = template.content.cloneNode(true);
		this.previewElement = clone.querySelector('.preview-card');
		document.body.appendChild(this.previewElement);
	}

	/**
	 * Injects metadata into the preview card DOM elements and applies anchor styling.
	 * @param {Object} metaData - The preview metadata object.
	 * @param {HTMLElement} link - The target anchor tag.
	 * @private
	 */
	#populatePreviewCard(metaData, link) {
		if (!this.previewElement) {
			return;
		}

		const titleEl = this.previewElement.querySelector('.preview-title');
		const descEl = this.previewElement.querySelector('.preview-desc');
		const imgWrapper = this.previewElement.querySelector('.preview-img-wrapper');
		const imgEl = this.previewElement.querySelector('.preview-img');

		if (titleEl) {
			titleEl.textContent = this.#decodeEntities(metaData.pageTitle || '');
		}

		if (descEl) {
			descEl.textContent = this.#decodeEntities(metaData.pageDescription || '');
			descEl.style.display = metaData.pageDescription ? '-webkit-box' : 'none';
		}

		if (imgEl && imgWrapper) {
			imgEl.removeAttribute('src');

			if (metaData.previewImage) {
				imgEl.src = metaData.previewImage;
				imgEl.alt = metaData.pageImageAlt || '';

				imgWrapper.style.display = 'block';
				imgWrapper.style.setProperty(
					'--preview-bg-image',
					`url('${metaData.previewImage}')`
				);
			} else {
				imgWrapper.style.display = 'none';
				imgWrapper.style.removeProperty('--preview-bg-image');
			}
		}

		if (this.supportsAnchor) {
			link.style.anchorName = '--active-preview-link';
		}
	}

	/**
	 * Fetches metadata and renders the preview card UI.
	 * @param {HTMLElement} link - The target anchor tag.
	 * @private
	 */
	async #showPreview(link) {
		const metaData = await this.#fetchPreviewData(link);

		if (!metaData || this.activeLink !== link) {
			return;
		}

		this.#ensureTemplateExists();
		if (!this.previewElement) {
			return;
		}

		this.#populatePreviewCard(metaData, link);

		requestAnimationFrame(() => {
			this.previewElement.classList.add('visible');
		});
	}

	/**
	 * Hides the preview card and cleans up dynamic styling.
	 * @private
	 */
	#hidePreview() {
		if (this.previewElement) {
			this.previewElement.classList.remove('visible');
			this.lastHideTime = Date.now();

			if (this.activeLink && this.supportsAnchor) {
				const linkToUnanchor = this.activeLink;

				setTimeout(() => {
					if (this.activeLink !== linkToUnanchor) {
						linkToUnanchor.style.removeProperty('anchor-name');
					}
				}, PreviewManager.TRANSITION_DURATION);
			}
		}
	}

	/**
	 * Safely decodes HTML entities from a string.
	 * @param {string} text - The encoded string.
	 * @returns {string} The decoded string.
	 * @private
	 */
	#decodeEntities(text) {
		if (!text) {
			return '';
		}
		const parser = new DOMParser();
		const doc = parser.parseFromString(text, 'text/html');
		return doc.documentElement.textContent;
	}
}
