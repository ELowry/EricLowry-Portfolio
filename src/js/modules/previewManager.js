import { Meta } from './meta.js';
import { ExternalLinks } from './externalLinks.js';

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

		this.#init();
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

		clearTimeout(this.hoverTimer);
		this.hoverTimer = setTimeout(() => this.#showPreview(link), 300);
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
	 * Fetches metadata and renders the preview card UI.
	 * @param {HTMLElement} link - The target anchor tag.
	 * @private
	 */
	async #showPreview(link) {
		let metaData = null;

		if (link.classList.contains('md-external-link')) {
			const url = link.href;
			const externalData = await ExternalLinks.getData();
			const match = externalData[url];

			if (match && (match.title || match.description || match.image)) {
				metaData = {
					pageTitle: match.title,
					pageDescription: match.description,
					previewImage: match.image,
					pageImageAlt: match.imageAlt || match.title,
				};
			}
		} else {
			const path = link.getAttribute('data-preview-path');
			if (path) {
				const result = await Meta.getMetadataForPath(path);
				if (result.previewImage || result.pageDescription) {
					metaData = result;
				} else {
					console.warn(`No preview data available for ${path}`);
				}
			}
		}

		if (!metaData || this.activeLink !== link) {
			return;
		}

		if (!this.previewElement) {
			const template = document.getElementById('template-preview-card');
			if (!template) {
				return;
			}
			const clone = template.content.cloneNode(true);
			this.previewElement = clone.querySelector('.preview-card');
			document.body.appendChild(this.previewElement);
		}

		const titleEl = this.previewElement.querySelector('.preview-title');
		const descEl = this.previewElement.querySelector('.preview-desc');
		const imgEl = this.previewElement.querySelector('.preview-img');

		if (titleEl) {
			titleEl.textContent = metaData.pageTitle || '';
		}

		if (descEl) {
			descEl.textContent = metaData.pageDescription || '';
			descEl.style.display = metaData.pageDescription ? '-webkit-box' : 'none';
		}

		if (imgEl) {
			if (metaData.previewImage) {
				imgEl.src = metaData.previewImage;
				imgEl.alt = metaData.pageImageAlt || '';
				imgEl.style.display = 'block';
			} else {
				imgEl.style.display = 'none';
			}
		}

		if (this.supportsAnchor) {
			link.style.anchorName = '--active-preview-link';
		}

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

			if (this.activeLink && this.supportsAnchor) {
				const linkToUnanchor = this.activeLink;

				setTimeout(() => {
					if (this.activeLink !== linkToUnanchor) {
						linkToUnanchor.style.removeProperty('anchor-name');
					}
				}, 200);
			}
		}
	}
}
