import { Lang } from './lang.js';
import { Navigation } from './navigation.js';
import { LayeredInput } from './layeredInputs.js';

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
	/** @type {HTMLElement[]} Array of gallery items in the active gallery. */
	#currentGalleryItems;
	/** @type {number} The index of the currently active item. */
	#currentIndex;
	/** @type {IntersectionObserver|null} Observer to keep #currentIndex in sync with scrolling. */
	#intersectionObserver;

	constructor(app) {
		/** @type {AppController} Main application instance. */
		this.app = app;

		this.#activeModal = null;
		this.#lastFocusedElement = null;
		this.#currentGalleryItems = [];
		this.#currentIndex = 0;
		this.#intersectionObserver = null;

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
		if (this.#activeModal) {
			if (event.key === 'ArrowRight') {
				this.#navigate(1);
			} else if (event.key === 'ArrowLeft') {
				this.#navigate(-1);
			}
		} else if (event.key === 'Enter' || event.key === ' ') {
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

		LayeredInput.activate(LayeredInput.LAYER_GALLERY);

		const template = document.getElementById(GalleryDisplay.TEMPLATE_ID);
		if (!template) {
			console.error(`Gallery template #${GalleryDisplay.TEMPLATE_ID} not found.`);
			return;
		}

		this.#lastFocusedElement = itemElement;

		const galleryContainer = itemElement.closest(`.${Gallery.DEFAULT_GALLERY_CLASS}`);
		if (galleryContainer) {
			this.#currentGalleryItems = Array.from(
				galleryContainer.querySelectorAll(`.${Gallery.DEFAULT_ITEM_CLASS}`)
			);
			this.#currentIndex = this.#currentGalleryItems.indexOf(itemElement);
		} else {
			this.#currentGalleryItems = [itemElement];
			this.#currentIndex = 0;
		}

		const clone = template.content.cloneNode(true);

		// Apply translation from template
		Lang.performTranslation(clone);

		this.#activeModal = clone.querySelector('dialog');
		document.body.appendChild(clone);

		const prevBtn = this.#activeModal.querySelector('.gallery-modal-prev');
		const nextBtn = this.#activeModal.querySelector('.gallery-modal-next');

		if (prevBtn) {
			prevBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.#navigate(-1);
			});
		}
		if (nextBtn) {
			nextBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.#navigate(1);
			});
		}

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
			if (
				e.target.tagName !== 'IMG'
				&& !e.target.closest('.gallery-modal-prev')
				&& !e.target.closest('.gallery-modal-next')
			) {
				this.#activeModal.close();
			}
		});

		this.#renderAllImages();

		requestAnimationFrame(() => {
			if (this.#activeModal) {
				Navigation.pushContext(this.#activeModal, { scroll: true, axis: 'x' });
				this.#activeModal.showModal();
				document.body.style.overflow = 'hidden';

				const contentContainer = this.#activeModal.querySelector('.gallery-modal-content');
				if (contentContainer) {
					contentContainer.setAttribute('tabindex', '-1');
					contentContainer.focus();

					contentContainer.style.scrollBehavior = 'auto';
					contentContainer.scrollLeft = contentContainer.clientWidth * this.#currentIndex;
					requestAnimationFrame(() => {
						contentContainer.style.scrollBehavior = 'smooth';
					});
				}
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

		if (this.#intersectionObserver) {
			this.#intersectionObserver.disconnect();
			this.#intersectionObserver = null;
		}

		this.#activeModal.remove();
		this.#activeModal = null;
		this.#currentGalleryItems = [];
		this.#currentIndex = 0;
		document.body.style.overflow = ''; // Restores the body scroll
		LayeredInput.deactivate(LayeredInput.LAYER_GALLERY);
		Navigation.popContext();

		// Restore focus back to the selected gallery item
		if (this.#lastFocusedElement) {
			this.#lastFocusedElement.focus();
			this.#lastFocusedElement = null;
		}
	}

	/**
	 * Populates the layout with all images mapped to scroll snapshots
	 * @private
	 */
	#renderAllImages() {
		if (!this.#activeModal || this.#currentGalleryItems.length === 0) {
			return;
		}

		const contentContainer = this.#activeModal.querySelector('.gallery-modal-content');
		if (!contentContainer) {
			return;
		}

		contentContainer.innerHTML = '';

		this.#currentGalleryItems.forEach((currentItem, index) => {
			const itemContainer = document.createElement('div');
			itemContainer.className = 'gallery-modal-item';
			itemContainer.dataset.index = index;

			const mediaNode = currentItem.querySelector('picture, img');
			if (mediaNode) {
				const mediaClone = mediaNode.cloneNode(true);

				// Progressive blur-up loading.
				if (mediaClone.tagName === 'PICTURE') {
					const originalImg = mediaNode.querySelector('img');
					const imgElement = mediaClone.querySelector('img');

					const cachedSrc = originalImg
						? originalImg.currentSrc || originalImg.src
						: null;

					if (imgElement) {
						imgElement.removeAttribute('class');
						if (imgElement.hasAttribute('sizes')) {
							imgElement.setAttribute('sizes', '100vw');
						}

						if (cachedSrc) {
							mediaClone.style.backgroundImage = `url("${cachedSrc}")`;

							const onImageLoad = () => {
								imgElement.classList.add('loaded');
							};

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

				itemContainer.appendChild(mediaClone);
			}

			contentContainer.appendChild(itemContainer);
		});

		// Intersection observer for snap layout
		this.#intersectionObserver = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const newIndex = parseInt(entry.target.dataset.index, 10);
						if (this.#currentIndex !== newIndex) {
							this.#currentIndex = newIndex;
							this.#updateUI();
						}
					}
				}
			},
			{
				root: contentContainer,
				threshold: 0.5,
			}
		);

		const snapItems = contentContainer.querySelectorAll('.gallery-modal-item');
		for (const el of snapItems) {
			this.#intersectionObserver.observe(el);
		}

		// Initialize UI variables/classes
		this.#updateUI();
	}

	/**
	 * Keeps carousel controls, screen-readers, and labels synced with UI
	 * @private
	 */
	#updateUI() {
		if (!this.#activeModal || this.#currentGalleryItems.length === 0) {
			return;
		}

		const prevBtn = this.#activeModal.querySelector('.gallery-modal-prev');
		const nextBtn = this.#activeModal.querySelector('.gallery-modal-next');
		let galleryIsMultiple = this.#currentGalleryItems.length > 1;

		if (prevBtn) {
			prevBtn.classList.toggle('disabled', !(galleryIsMultiple && this.#currentIndex > 0));
		}
		if (nextBtn) {
			nextBtn.classList.toggle(
				'disabled',
				!(galleryIsMultiple && this.#currentIndex < this.#currentGalleryItems.length - 1)
			);
		}

		const announcer = this.#activeModal.querySelector('.gallery-modal-announcer');
		const currentItem = this.#currentGalleryItems[this.#currentIndex];
		const modalItems = this.#activeModal.querySelectorAll('.gallery-modal-item');
		modalItems.forEach((item, index) => {
			if (index === this.#currentIndex) {
				item.removeAttribute('aria-hidden');
			} else {
				item.setAttribute('aria-hidden', 'true');
			}
		});

		if (announcer && currentItem) {
			const mediaNode = currentItem.querySelector('picture, img');
			const imgElement =
				mediaNode?.tagName === 'PICTURE' ? mediaNode.querySelector('img') : mediaNode;
			const altText = imgElement ? imgElement.alt : '';
			announcer.textContent = `Image ${this.#currentIndex + 1} of ${this.#currentGalleryItems.length}: ${altText}`;
		}
	}

	/**
	 * Navigates to the next or previous image in the gallery context.
	 * @param {number} direction - 1 for next, -1 for previous.
	 * @private
	 */
	#navigate(direction) {
		if (!this.#currentGalleryItems.length) return;

		const newIndex = this.#currentIndex + direction;
		const maxIndex = this.#currentGalleryItems.length - 1;

		// Prevent out-of-bounds navigation
		if (newIndex < 0 || newIndex > maxIndex) {
			return;
		}

		const contentContainer = this.#activeModal.querySelector('.gallery-modal-content');
		if (contentContainer) {
			contentContainer.scrollTo({
				left: contentContainer.clientWidth * newIndex,
				behavior: 'smooth',
			});
		}
	}
}
