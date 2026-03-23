import { Lang } from './lang.js';
import { Navigation } from './navigation.js';

/**
 * Converts marked.js markdown tables into HTML galleries.
 */
export class Gallery {
	/**
	 * The default class applied to the gallery container.
	 * @returns {string}
	 * @constant
	 */
	static get DEFAULT_GALLERY_CLASS() {
		return 'md-gallery';
	}

	/**
	 * The default class applied to each gallery item figure.
	 * @returns {string}
	 * @constant
	 */
	static get DEFAULT_ITEM_CLASS() {
		return 'md-gallery-item';
	}

	/**
	 * The default keyword to place in the first table header cell to trigger the gallery render.
	 * @returns {string}
	 * @constant
	 */
	static get DEFAULT_TRIGGER_KEYWORD() {
		return 'Gallery:';
	}

	/**
	 * @param {Object} options - Configuration options for the gallery.
	 * @returns {Object} the custom renderer object for marked.js.
	 * @private
	 */
	static #getMarkedRenderer(options) {
		const config = {
			galleryClass: options?.galleryClass || Gallery.DEFAULT_GALLERY_CLASS,
			itemClass: options?.itemClass || Gallery.DEFAULT_ITEM_CLASS,
			triggerKeyword: options?.triggerKeyword || Gallery.DEFAULT_TRIGGER_KEYWORD,
		};

		return {
			/**
			 * Table renderer.
			 * Converts tables with the trigger keyword into a div structure.
			 * @param {Object} token - The marked token for the table.
			 * @returns {string|boolean} The rendered HTML, or false to fall back to default table rendering.
			 */
			table(token) {
				const isGallery =
					token.header
					&& token.header.length > 0
					&& token.header[0].text.trim() === config.triggerKeyword;

				if (!isGallery) {
					return false;
				}

				let galleryHtml = `<div class="${config.galleryClass}">\n`;

				for (const row of token.rows) {
					for (const cell of row) {
						const images = cell.tokens.filter((t) => t.type === 'image');

						for (const img of images) {
							let renderedImg = '';

							if (this.parser && typeof this.parser.parseInline === 'function') {
								renderedImg = this.parser.parseInline([img]);
							} else {
								renderedImg = `<img src="${img.href}" alt="${img.text}" title="${img.title || ''}" />`;
							}

							galleryHtml += `\t<figure class="${config.itemClass}" tabindex="0" role="button" aria-label="${Lang.getString('ui.gallery.imageOpenModal')}">\n\t\t${renderedImg}\n\t</figure>\n`;
						}
					}
				}

				galleryHtml += '</div>\n';

				return galleryHtml;
			},
		};
	}

	/**
	 * The marked.js extension configuration object.
	 * @param {Object} [options={}] - Optional configuration overrides.
	 * @returns {Object}
	 */
	static getMarkedExtension(options = {}) {
		return {
			renderer: Gallery.#getMarkedRenderer(options),
		};
	}
}

/**
 * Manages a fullscreen modal to display gallery images in an overlay.
 *
 * @param {AppController} app - Reference to the App instance.
 */
export class GalleryDisplay {
	/** @type {HTMLDialogElement|null} Reference to the currently open modal. */
	#activeModal;
	/** @type {HTMLElement|null} The last element that triggered the modal. */
	#lastFocusedElement;

	constructor(app) {
		/** @type {AppController} Main application instance. */
		this.app = app;

		this.#activeModal = null;
		this.#lastFocusedElement = null;

		this.#init();
	}

	/**
	 * The ID of the HTML template used to construct the modal.
	 * @returns {string}
	 * @constant
	 */
	static get TEMPLATE_ID() {
		return 'gallery-modal-template';
	}

	/**
	 * Initializes event listeners for gallery interactions.
	 * @private
	 */
	#init() {
		document.addEventListener('click', (e) => this.#handleClick(e));
		document.addEventListener('keydown', (e) => this.#handleKeyDown(e));
	}

	/**
	 * Handle global click events to intercept gallery item clicks.
	 * @param {MouseEvent} event
	 * @private
	 */
	#handleClick(event) {
		const target = event.target;
		const galleryItem = target.closest(`.${Gallery.DEFAULT_ITEM_CLASS}`);

		if (galleryItem) {
			this.#openModal(galleryItem);
		}
	}

	/**
	 * Handle global keydown events for keyboard accessibility.
	 * Enter/Space to open.
	 * @param {KeyboardEvent} event
	 * @private
	 */
	#handleKeyDown(event) {
		if (event.key === 'Enter' || event.key === ' ') {
			const activeElement = document.activeElement;
			if (activeElement && activeElement.classList.contains(Gallery.DEFAULT_ITEM_CLASS)) {
				// Prevent Space from scrolling
				event.preventDefault();
				this.#openModal(activeElement);
			}
		}
	}

	/**
	 * Opens the modal.
	 * @param {HTMLElement} itemElement - The focused or clicked gallery figure.
	 * @private
	 */
	#openModal(itemElement) {
		if (this.#activeModal) {
			return;
		}

		const template = document.getElementById(GalleryDisplay.TEMPLATE_ID);
		if (!template) {
			console.error(`Gallery template #${GalleryDisplay.TEMPLATE_ID} not found.`);
			return;
		}

		const mediaNode = itemElement.querySelector('picture, img');
		if (!mediaNode) {
			return;
		}

		this.#lastFocusedElement = itemElement;

		const clone = template.content.cloneNode(true);
		const contentContainer = clone.querySelector('.gallery-modal-content');

		if (contentContainer) {
			const mediaClone = mediaNode.cloneNode(true);

			// Progressive blur-up loading.
			if (mediaClone.tagName === 'PICTURE') {
				const originalImg = mediaNode.querySelector('img');
				const imgElement = mediaClone.querySelector('img');

				// Grab the exact responsive thumbnail the browser is currently displaying
				const cachedSrc = originalImg ? originalImg.currentSrc || originalImg.src : null;

				if (imgElement) {
					imgElement.removeAttribute('class');
					if (imgElement.hasAttribute('sizes')) {
						imgElement.setAttribute('sizes', '100vw');
					}

					// Use lower resolution image as background until the high-res version is loaded
					if (cachedSrc) {
						mediaClone.style.backgroundImage = `url("${cachedSrc}")`;

						const onImageLoad = () => {
							imgElement.classList.add('loaded');
							setTimeout(() => {
								if (mediaClone) {
									// mediaClone.style.backgroundImage = 'none';
								}
							}, 300); // Match CSS transition duration
						};

						// If the high-res image is already fully cached, the 'load' event might not fire.
						if (imgElement.complete) {
							onImageLoad();
						} else {
							imgElement.addEventListener('load', onImageLoad, { once: true });
						}
					}
				}

				const sources = mediaClone.querySelectorAll('source');
				for (const source of sources) {
					if (source.hasAttribute('sizes')) {
						source.setAttribute('sizes', '100vw');
					}
				}
			} else {
				if (mediaClone.hasAttribute('sizes')) {
					mediaClone.setAttribute('sizes', '100vw');
				}
				mediaClone.removeAttribute('class');
			}

			contentContainer.appendChild(mediaClone);
		}

		// Apply translation from template
		Lang.performTranslation(clone);

		this.#activeModal = clone.querySelector('dialog');

		document.body.appendChild(clone);

		const observer = new MutationObserver(() => {
			if (!itemElement.isConnected) {
				this.#activeModal?.close();
			}
		});

		observer.observe(document.body, { childList: true, subtree: true });

		this.#activeModal.addEventListener('close', () => {
			observer.disconnect();
			this.#cleanupModal();
		});

		this.#activeModal.addEventListener('click', (e) => {
			if (e.target.tagName !== 'IMG') {
				this.#activeModal.close();
			}
		});

		requestAnimationFrame(() => {
			if (this.#activeModal) {
				Navigation.pushContext(this.#activeModal, { scroll: true, axis: 'x' });
				this.#activeModal.showModal();
				document.body.style.overflow = 'hidden';
			}
		});
	}

	/**
	 * Destroys the modal.
	 * @private
	 */
	#cleanupModal() {
		if (!this.#activeModal) {
			return;
		}

		this.#activeModal.remove();
		this.#activeModal = null;
		document.body.style.overflow = ''; // Restores the body scroll
		Navigation.popContext();

		// Restore focus back to the selected gallery item
		if (this.#lastFocusedElement) {
			this.#lastFocusedElement.focus();
			this.#lastFocusedElement = null;
		}
	}
}
