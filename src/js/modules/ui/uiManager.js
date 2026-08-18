import { Navigation } from '../input/navigation.js';
import { Events } from '../core/events.js';
import { Lang } from './lang.js';
import { LayeredInput } from '../core/layeredInputs.js';
import { InputPrompts } from '../input/inputPrompts.js';
import { Router } from '../core/router.js';
import { Content } from '../content/content.js';
import { Obfuscator } from '../markdown/obfuscator.js';
import { VirtualCursor } from '../input/virtualCursor.js';
import { scrollToHash } from '../core/sharedUtils.js';

/**
 * Orchestrates all DOM manipulations, UI state transitions, and event handling.
 */
export class UIManager {
	/**
	 * @param {AppController} app - Main application instance.
	 */
	constructor(app) {
		this.app = app;

		/** @type {Object} References to core DOM elements used across the application. */
		this.elements = {
			// Layer containers
			gameLayer: document.getElementById('game-layer'),
			textLayer: document.getElementById('text-layer'),

			// Dialogs/modals
			gameWelcome: document.getElementById('welcome-screen'),
			gameMenu: document.getElementById('game-menu'),
			gameModal: document.getElementById('game-modal'),

			// Menu elements
			gameMenuButton: document.getElementById('menu-button'),
			gameMenuItems: document.querySelectorAll('#game-menu [role^="menuitem"]'),
			gameResetButton: document.getElementById('reset-button'),

			// Content containers
			gameModalContent: document.getElementById('game-modal-content'),
			textContent: document.getElementById('text-content'),
			tableOfContents: document.getElementById('text-table-of-contents'),

			// Text mode navigation
			textNav: document.getElementById('text-nav'),
			textNavbar: document.getElementById('text-navbar'),
			textHeader: document.querySelector('#text-layer h1'),

			// Overlays
			loadingOverlay: document.getElementById('loading-overlay'),
			interactionOverlay: document.getElementById('interaction-label-overlay'),
			interactionLabelText: document.getElementById('interaction-label-text'),

			// Touch interface
			touchControls: document.getElementById('touch-controls'),
			touchInstructions: document.getElementById('touch-instructions'),
			touchDontShow: document.getElementById('touch-dont-show'),
			virtualCursorTemplate: document.getElementById('template-virtual-cursor'),
			tmpl404Breadcrumbs: document.getElementById('template-404-breadcrumbs'),
			tmpl404Content: document.getElementById('template-404-content'),
		};

		/** @type {number} Timestamp when the last loading task started. */
		this.loadingStartTime = 0;
		/** @type {number} Timestamp of the last horizontal navigation move in menus. */
		this.lastSubmenuMoveTime = 0;
		/** @type {number|null} Handle for the interaction label's visibility timeout. */
		this.interactionOverlayTimeout = null;
	}

	/**
	 * @returns {number} the minimum time threshold for fade animations.
	 * @constant
	 */
	static get FADE_MIN_ELAPSED_MS() {
		return 16;
	}

	/**
	 * @returns {number} the standard duration for screen transitions and UI fades.
	 * @constant
	 */
	static get FADE_DURATION_MS() {
		return 500;
	}

	/**
	 * @returns {number} the minimum complexity score for the table of contents to be displayed.
	 * @constant
	 */
	static get TABLE_OF_CONTENTS_COMPLEXITY_THRESHOLD() {
		return 2.7;
	}

	/**
	 * @returns {number} the maximum nesting depth for the Table of Contents tree.
	 * @constant
	 */
	static get TABLE_OF_CONTENTS_MAX_DEPTH() {
		return 3;
	}

	/**
	 * Returns the LittleJS canvas element.
	 * @returns {HTMLCanvasElement|null} the canvas if it exists within the game layer.
	 */
	get canvas() {
		return this.elements.gameLayer?.querySelector('canvas');
	}

	/**
	 * Binds global DOM events and initializes interactive UI components.
	 */
	init() {
		// Virtual Cursor
		VirtualCursor.init(this.elements.virtualCursorTemplate);

		// Welcome Screen
		this.elements.gameWelcome?.addEventListener('close', () => {
			LayeredInput.deactivate(LayeredInput.LAYER_GAME_WELCOME);
			this.app.onModalClose(false);
		});

		// Text Nav (Breadcrumbs)
		this.elements.textNav?.addEventListener('keydown', (e) => {
			this.#handleMenuNavigation(e, this.elements.textNav, 'both');
		});

		// Text Navbar (Main Menu)
		this.elements.textNavbar?.addEventListener('keydown', (e) => {
			// Special handling for opening submenus with Down arrow
			if (e.key === 'ArrowDown' && document.activeElement) {
				if (document.activeElement.getAttribute('aria-haspopup') === 'menu') {
					e.preventDefault();
					this.toggleSubmenu(document.activeElement, true);
					return;
				}
			}

			this.#handleMenuNavigation(e, this.elements.textNavbar, 'x');
		});

		this.#setupGameMenuEvents();
		this.#setupGameModalEvents();
		this.#setupSubmenuEvents();
		this.#setupInteractionLabelEvents();

		if (this.elements.textNavbar) {
			this.#resetTabFocus(this.elements.textNavbar);

			this.elements.textNavbar.addEventListener('focusout', (e) => {
				if (!this.elements.textNavbar.contains(e.relatedTarget)) {
					this.#resetTabFocus(this.elements.textNavbar);
				}
			});
		}

		// Load Preferences
		if (localStorage.getItem('readabilityMode') === 'true') {
			this.toggleReadabilityMode(true);
		}

		// Ensure the `marked` class exists for markdown styling
		if (this.elements.gameModalContent) {
			this.elements.gameModalContent.classList.add('marked');
		}
		if (this.elements.textContent) {
			this.elements.textContent.classList.add('marked');
		}

		// Contact Obfuscation Restoration
		document.addEventListener('focus', Obfuscator.restoreProtectedLink, true);
		document.addEventListener('mouseover', Obfuscator.restoreProtectedLink);
		document.addEventListener('click', Obfuscator.restoreProtectedLink);
		// Reveal before the print spooler grabs the DOM
		window.addEventListener('beforeprint', Obfuscator.revealAllForPrint);

		Events.on('route:changed', (payload) => {
			if (payload.mode === 'text') {
				const navButtons = document.querySelectorAll('#text-navbar button[data-nav-path]');
				for (const navButton of navButtons) {
					const isCurrent = payload.path.startsWith(navButton.dataset.navPath);
					navButton.disabled = isCurrent;
					if (isCurrent) {
						navButton.setAttribute('aria-current', 'page');
					} else {
						navButton.removeAttribute('aria-current');
					}
				}
			}
		});
	}

	/**
	 * Configures listeners for the in-game dialog menu.
	 * @private
	 */
	#setupGameMenuEvents() {
		if (!this.elements.gameMenu) {
			return;
		}

		this.elements.gameMenu.addEventListener('cancel', (e) => {
			e.preventDefault();
		});

		this.elements.gameMenu.addEventListener('close', () => {
			LayeredInput.deactivate(LayeredInput.LAYER_GAME_MENU);
			this.app.onModalClose();
			this.elements.gameMenuButton?.setAttribute('aria-expanded', 'false');
			this.elements.gameMenuButton?.focus({ focusVisible: false });

			if (this.app.mode === 'game') {
				Navigation.setContext(null);
			}
		});

		this.elements.gameMenu.addEventListener('open', () => {
			requestAnimationFrame(() => {
				const items = Array.from(
					this.elements.gameMenu.querySelectorAll('[role^="menuitem"], a[href], button')
				);
				const firstItem = items.find((el) => !el.disabled && el.offsetParent !== null);

				if (firstItem) {
					firstItem.tabIndex = 0;
					firstItem.focus({ focusVisible: true });
				}
			});

			this.elements.gameMenuButton?.setAttribute('aria-expanded', 'true');
		});

		this.elements.gameMenu.addEventListener('keydown', (e) => {
			this.#handleMenuNavigation(e, this.elements.gameMenu, 'y');
		});
	}

	/**
	 * Configures listeners for the content modal dialog.
	 * @private
	 */
	#setupGameModalEvents() {
		if (!this.elements.gameModal) {
			return;
		}

		this.elements.gameModal.addEventListener('cancel', (e) => {
			e.preventDefault();
		});

		this.elements.gameModal.addEventListener('close', () => {
			LayeredInput.deactivate(LayeredInput.LAYER_GAME_MODAL);
			// Ensure the URL reverts to the parent path when closing a content node dialogue
			if (Router.currentMode === 'game') {
				const node = Content.findNodeByPath(Router.currentPath);
				if (node && node.type === 'content') {
					const parentPath = Router.currentPath.split('/').slice(0, -1).join('/');
					this.app.navigate(parentPath);
				}
			}

			this.app.onModalClose();

			Navigation.setContext(null);
		});
	}

	/**
	 * Configures click-to-toggle and outside-click-to-close logic for all submenus.
	 * @private
	 */
	#setupSubmenuEvents() {
		document.body.addEventListener('click', (e) => {
			const trigger = e.target.closest('[aria-haspopup="menu"]');
			if (!trigger) {
				const openTextMenu = document.getElementById('text-options-submenu');
				if (openTextMenu && !openTextMenu.hidden) {
					const textTrigger = document.querySelector(
						'[aria-controls="text-options-submenu"]'
					);
					if (
						!openTextMenu.contains(e.target)
						&& (!textTrigger || !textTrigger.contains(e.target))
					) {
						this.toggleSubmenu(textTrigger, false);
					}
				}
				return;
			}
			this.toggleSubmenu(trigger);
		});
	}

	/**
	 * Configures listeners for displaying world interaction text popups.
	 * @private
	 */
	#setupInteractionLabelEvents() {
		this.interactionOverlayTimeout = null;

		Events.on('interaction:label', (text) => {
			if (!this.elements.interactionOverlay || !this.elements.interactionLabelText) {
				return;
			}

			if (!text) {
				this.elements.interactionOverlay.classList.remove('shown');
				this.interactionOverlayTimeout = setTimeout(() => {
					if (this.elements.interactionLabelText) {
						this.elements.interactionLabelText.textContent = '';
					}
					this.interactionOverlayTimeout = null;
				}, 240);
				return;
			}

			if (this.interactionOverlayTimeout) {
				clearTimeout(this.interactionOverlayTimeout);
				this.interactionOverlayTimeout = null;
			}
			this.elements.interactionLabelText.textContent = text;
			this.elements.interactionOverlay.classList.add('shown');
		});
	}

	/**
	 * Forces all modals, menus, and overlays to close (used during mode shifts).
	 * @private
	 */
	#resetGameInterface() {
		if (this.elements.gameMenu?.open) {
			this.elements.gameMenu.close();
		}
		if (this.elements.gameModal?.open) {
			this.elements.gameModal.close();
		}
		if (this.elements.gameWelcome?.open) {
			this.elements.gameWelcome.close();
		}

		if (this.elements.interactionOverlay) {
			this.elements.interactionOverlay.classList.remove('shown');
			if (this.elements.interactionLabelText) {
				this.elements.interactionLabelText.textContent = '';
			}
		}

		if (this.interactionOverlayTimeout) {
			clearTimeout(this.interactionOverlayTimeout);
			this.interactionOverlayTimeout = null;
		}

		this.elements.touchControls?.classList.add('hidden');
		this.elements.touchInstructions?.classList.add('hidden');

		Navigation.setContext(null);
	}

	/**
	 * Logic for 'roving tabindex' arrow navigation within a container.
	 * @param {KeyboardEvent} e - The keyboard event object.
	 * @param {HTMLElement} container - The DOM container holding the menu items.
	 * @param {string} [axis='both'] - Which arrow keys to listen to (`x`, `y`, or `both`).
	 * @returns {boolean} whether navigation was handled.
	 * @private
	 */
	#handleMenuNavigation(e, container, axis = 'both') {
		const allItems = Array.from(container.querySelectorAll('[role^="menuitem"], a[href]'));
		const items = allItems.filter((el) => {
			if (el.disabled || el.hasAttribute('disabled')) {
				return false;
			}

			// Exclude items inside hidden parents
			const hiddenParent = el.closest('[hidden]');
			if (hiddenParent && hiddenParent !== container) {
				return false;
			}
			return el.offsetParent !== null;
		});

		if (items.length === 0) {
			return false;
		}

		const current = document.activeElement;
		const currentIndex = items.indexOf(current);
		if (currentIndex === -1) {
			return false;
		}

		let nextIndex = null;
		if (e.key === 'Home') {
			nextIndex = 0;
		} else if (e.key === 'End') {
			nextIndex = items.length - 1;
		} else if (
			!Navigation.activeContainer
			|| !Navigation.activeContainer.contains(container)
			|| !Navigation.options.axis
			|| Navigation.options.axis === axis
		) {
			if ((axis === 'y' || axis === 'both') && e.key === 'ArrowDown') {
				nextIndex = (currentIndex + 1) % items.length;
			} else if ((axis === 'y' || axis === 'both') && e.key === 'ArrowUp') {
				nextIndex = (currentIndex - 1 + items.length) % items.length;
			} else if ((axis === 'x' || axis === 'both') && e.key === 'ArrowRight') {
				nextIndex = (currentIndex + 1) % items.length;
			} else if ((axis === 'x' || axis === 'both') && e.key === 'ArrowLeft') {
				nextIndex = (currentIndex - 1 + items.length) % items.length;
			}
		}

		if (nextIndex !== null) {
			e.preventDefault();
			items[currentIndex].tabIndex = -1;
			items[nextIndex].tabIndex = 0;
			items[nextIndex].focus({ focusVisible: true });
			return true;
		}

		return false;
	}

	/**
	 * Resets the tab index of items in a container (First item 0, others -1).
	 * @param {HTMLElement} container - The DOM container holding the items to reset.
	 * @private
	 */
	#resetTabFocus(container) {
		const allItems = Array.from(container.querySelectorAll('[role^="menuitem"], a[href]'));
		const items = allItems.filter((el) => {
			if (el.disabled || el.hasAttribute('disabled')) {
				return false;
			}
			const hiddenParent = el.closest('[hidden]');
			if (hiddenParent && hiddenParent !== container) {
				return false;
			}
			return el.offsetParent !== null;
		});
		items.forEach((el, i) => {
			el.tabIndex = i === 0 ? 0 : -1;
		});
	}

	/**
	 * Builds and displays the table of contents from the headings tree.
	 * @param {Array<Object>} headingsTree - The tree structure of headings.
	 * @private
	 */
	#displayTableOfContents(headingsTree) {
		const container = this.elements.tableOfContents;
		if (!container) {
			return;
		}

		container.innerHTML = '';
		container.hidden = false;

		const rootList = document.createElement('ol');
		headingsTree.forEach((heading, index) => {
			this.#appendHeadingToTableOfContents(rootList, heading, index, headingsTree.length, []);
		});
		container.appendChild(rootList);
	}

	/**
	 * Appends a heading to the table of contents.
	 * @param {HTMLElement} parentList - The parent list element.
	 * @param {Object} heading - The heading object.
	 * @param {number} index - The index of the heading.
	 * @param {number} total - The total number of headings.
	 * @param {Array<boolean>} parentsState - The state of the parent headings.
	 * @private
	 */
	#appendHeadingToTableOfContents(parentList, heading, index, total, parentsState) {
		const listItem = document.createElement('li');

		const isLast = index === total - 1;

		if (parentsState.length > 0) {
			// Create the marker span
			const marker = document.createElement('span');
			marker.setAttribute('aria-hidden', 'true');
			marker.classList.add('toc-marker');

			let prefix = '';
			// Vertical lines from parents: │ or space
			// We skip the first parent (top level) to keep things clean
			parentsState.slice(1).forEach((isParentLast) => {
				prefix += isParentLast ? '\u00A0\u00A0' : '│\u00A0';
			});

			// Current level connector: ├─ or └─
			prefix += isLast ? '└─' : '├─';

			marker.textContent = `${prefix}\u00A0`;
			listItem.appendChild(marker);
		}

		let item;
		if (heading.id != null) {
			item = document.createElement('a');
			item.setAttribute('href', `#${heading.id}`);
		} else {
			item = document.createElement('span');
		}
		item.textContent = heading.text;
		item.title = heading.text;
		listItem.appendChild(item);
		parentList.appendChild(listItem);

		if (heading.children && heading.children.length > 0) {
			const subList = document.createElement('ol');
			const newState = [...parentsState, isLast];
			heading.children.forEach((child, childIndex) => {
				this.#appendHeadingToTableOfContents(
					subList,
					child,
					childIndex,
					heading.children.length,
					newState
				);
			});
			listItem.appendChild(subList);
		}
	}

	/**
	 * Extracts headings from a container and builds a hierarchical tree.
	 * @param {HTMLElement} container - The container to extract headings from.
	 * @returns {Array<Object>} the hierarchical tree of headings.
	 * @private
	 */
	#getHeadingsTree(container) {
		const stack = [{ level: 0, children: [] }];
		let complexityScore = 0;

		const allHeadings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
		if (allHeadings.length === 0) {
			return { headings: [], complexity: 0 };
		}

		const h1s = allHeadings.filter((h) => {
			return h.tagName === 'H1';
		});
		const skipFirstH1 = h1s.length === 1 && allHeadings[0] === h1s[0];

		const headings = skipFirstH1 ? allHeadings.slice(1) : allHeadings;

		headings.forEach((heading) => {
			const level = parseInt(heading.tagName[1]);
			complexityScore += 1 / level;
			const node = {
				tag: heading.tagName.toLowerCase(),
				text: heading.textContent.trim(),
				id: heading.id || null,
				children: [],
			};

			while (stack[stack.length - 1].level >= level) {
				stack.pop();
			}

			if (stack.length > UIManager.TABLE_OF_CONTENTS_MAX_DEPTH) {
				return;
			}

			complexityScore += 1 / level;
			stack[stack.length - 1].children.push(node);
			stack.push({ level, ...node });
		});

		return { headings: stack[0].children, complexity: complexityScore };
	}

	/**
	 * Activates the full-screen loading layer.
	 * @param {boolean} [opaque=false] - If `true`, the background is fully solid white.
	 * @param {boolean} [fadeIn=false] - If `true`, performs a CSS transition.
	 */
	showLoading(opaque = false, fadeIn = false) {
		LayeredInput.activate(LayeredInput.LAYER_LOADING);

		const isHidden = this.elements.loadingOverlay.classList.contains('hidden');

		this.loadingStartTime = performance.now();
		this.elements.loadingOverlay.classList.toggle('opaque', opaque);

		if (fadeIn && isHidden) {
			this.elements.loadingOverlay.classList.add('fade-out');
			this.elements.loadingOverlay.classList.remove('hidden');
			// Trigger reflow
			void this.elements.loadingOverlay.offsetWidth;
			this.elements.loadingOverlay.classList.remove('fade-out');
		} else {
			this.elements.loadingOverlay.classList.remove('hidden', 'fade-out');
		}

		document.body.setAttribute('aria-busy', 'true');
		this.app.setLock(true);
	}

	/**
	 * Dismisses the loading layer with an optional fade-out.
	 * @param {boolean} [fade=false] - If `true`, waits for the fade-out animation to finish.
	 * @returns {Promise<void>} (resolves) when the overlay is completely hidden.
	 */
	async hideLoading(fade = false) {
		LayeredInput.deactivate(LayeredInput.LAYER_LOADING);

		const elapsed = performance.now() - (this.loadingStartTime || 0);
		const shouldFade = fade && elapsed > UIManager.FADE_MIN_ELAPSED_MS;

		if (shouldFade) {
			this.elements.loadingOverlay.classList.add('fade-out');
			await new Promise((resolve) => setTimeout(resolve, UIManager.FADE_DURATION_MS));
		}

		this.elements.loadingOverlay.classList.add('hidden');
		this.elements.loadingOverlay.classList.remove('fade-out', 'opaque');
		document.body.setAttribute('aria-busy', 'false');

		// Only clear the interaction lock if the game is the active layer
		if (LayeredInput.isActive(LayeredInput.LAYER_GAME, true)) {
			this.app.setLock(false);
		}
	}

	/**
	 * Switches visibility between the game and text layers and manages focus.
	 * @param {string} mode - The target mode (`game` or `text`).
	 */
	setMode(mode) {
		if (mode === 'game') {
			this.elements.gameLayer.classList.remove('hidden');
			this.elements.textLayer.classList.add('hidden');
			this.canvas?.focus({ focusVisible: false });
		} else {
			this.elements.gameLayer.classList.add('hidden');
			this.elements.textLayer.classList.remove('hidden');
			this.elements.textLayer.setAttribute('tabindex', '-1');
			this.elements.textLayer.focus({ focusVisible: false });

			if (this.elements.textLayer) {
				this.elements.textLayer.scrollTop = 0;
			}

			this.#resetGameInterface();
			Navigation.setContext(this.elements.textLayer, { scroll: true, axis: null });

			if (this.elements.textNavbar) {
				this.#resetTabFocus(this.elements.textNavbar);
			}
		}
	}

	/**
	 * Applies or removes the readability-focused styling class.
	 * @param {boolean|null} [forceState=null] - Optional boolean to set state explicitly.
	 */
	toggleReadabilityMode(forceState = null) {
		const root = document.documentElement;
		const currentState = root.classList.contains('readability-mode');
		const newState = forceState !== null ? forceState : !currentState;

		if (newState) {
			root.classList.add('readability-mode');
		} else {
			root.classList.remove('readability-mode');
		}

		localStorage.setItem('readabilityMode', newState);

		const toggles = document.querySelectorAll('.js-readability-toggle');
		toggles.forEach((btn) => {
			btn.setAttribute('aria-checked', newState.toString());
		});
	}

	/**
	 * Consumes input for UI-specific layers (modals, menus, text).
	 * @param {Object} inputState - The current state from the Input module.
	 * @returns {boolean} `true` if the input was consumed by the UI.
	 */
	handleInput(inputState) {
		// UI Layer
		if (LayeredInput.isActive(LayeredInput.LAYER_GAME_MODAL)) {
			Navigation.update(inputState);
			if (inputState.back || inputState.menu) {
				this.closeGameModal();
			}
			return true;
		}

		// Text Layer
		if (LayeredInput.isActive(LayeredInput.LAYER_TEXT)) {
			Navigation.update(inputState);

			// Browser History Navigation
			if (inputState.bumperLeft) {
				window.history.back();
			} else if (inputState.bumperRight) {
				window.history.forward();
			}

			return true;
		}

		// Modal layers
		if (LayeredInput.isActive(LayeredInput.LAYER_GAME_WELCOME)) {
			Navigation.update(inputState);
			if (inputState.interact) {
				const current = document.activeElement;
				if (current?.id === 'welcome-start-game') {
					this.app.closeGameWelcome('game');
				} else if (current?.id === 'welcome-start-text') {
					this.app.closeGameWelcome('text');
				}
			}
			return true;
		}
		if (LayeredInput.isActive(LayeredInput.LAYER_GAME_MENU)) {
			Navigation.update(inputState);
			this.handleSubmenuInput(inputState);

			if (inputState.menu || inputState.back) {
				this.app.closeGameMenu();
			}
			return true;
		}

		return false;
	}

	/**
	 * Displays the main in-game navigation dialog.
	 */
	openGameMenu() {
		this.app.setPause(true);
		this.elements.gameMenu.showModal();
		Navigation.setContext(this.elements.gameMenu, { scroll: false, axis: 'y', roving: true });
		this.elements.gameMenu.dispatchEvent(new Event('open'));
	}

	/**
	 * Closes the main in-game navigation dialog.
	 */
	closeGameMenu() {
		if (this.elements.gameMenu) {
			const expanded = this.elements.gameMenu.querySelectorAll('[aria-expanded="true"]');
			expanded.forEach((el) => this.toggleSubmenu(el, false));
		}

		this.elements.gameMenu.close();
		Navigation.setContext(null);
	}

	/**
	 * Displays the initial welcome/tutorial dialog.
	 */
	openGameWelcome() {
		if (!this.elements.gameWelcome._cancelListenerAdded) {
			this.elements.gameWelcome.addEventListener('cancel', (e) => e.preventDefault());
			this.elements.gameWelcome._cancelListenerAdded = true;
		}
		this.app.setLock(true);

		Navigation.setContext(this.elements.gameWelcome, {
			scroll: true,
			axis: 'x',
			roving: true,
		});
		this.elements.gameWelcome.showModal();
	}

	/**
	 * Closes the welcome dialog.
	 */
	closeGameWelcome() {
		this.elements.gameWelcome.close();
	}

	/**
	 * Manually closes the content modal dialog.
	 */
	closeGameModal() {
		this.elements.gameModal.close();
	}

	/**
	 * Toggles the expanded state of a nested menu.
	 * @param {HTMLElement} trigger - The button that opens/closes the menu.
	 * @param {boolean|null} [forceState=null] - Optional boolean to set state explicitly.
	 */
	toggleSubmenu(trigger, forceState = null) {
		const targetId = trigger.getAttribute('aria-controls');
		if (!targetId) {
			return;
		}

		const targetMenu = document.getElementById(targetId);
		if (!targetMenu) {
			return;
		}

		const currentlyExpanded = trigger.getAttribute('aria-expanded') === 'true';
		const shouldExpand = forceState !== null ? forceState : !currentlyExpanded;

		if (shouldExpand === currentlyExpanded) {
			return;
		}

		const isTextMode = this.app.mode === 'text';

		if (shouldExpand) {
			trigger.setAttribute('aria-expanded', 'true');
			targetMenu.hidden = false;

			if (isTextMode) {
				Navigation.pushContext(targetMenu, {
					roving: true,
					axis: 'y',
					autoFocus: true,
				});

				const closeHandler = (e) => {
					if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
						e.stopPropagation();
					}

					if (e.key === 'Tab') {
						this.toggleSubmenu(trigger, false);
						return;
					}

					if (e.key === 'Home' || e.key === 'End') {
						e.preventDefault();
						e.stopPropagation();
						this.#handleMenuNavigation(e, targetMenu, 'y');
						return;
					}

					if (e.key === 'Escape' || e.key === 'ArrowLeft') {
						e.preventDefault();
						this.toggleSubmenu(trigger, false);
						trigger.focus();
					} else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
						e.preventDefault();
						this.#handleMenuNavigation(e, targetMenu, 'y');
					}
				};
				targetMenu.addEventListener('keydown', closeHandler);
				targetMenu._closeHandler = closeHandler;
			}
		} else {
			trigger.setAttribute('aria-expanded', 'false');
			targetMenu.hidden = true;

			this.#resetTabFocus(targetMenu);

			if (isTextMode) {
				Navigation.popContext();

				if (targetMenu._closeHandler) {
					targetMenu.removeEventListener('keydown', targetMenu._closeHandler);
					delete targetMenu._closeHandler;
				}
			}
		}
	}

	/**
	 * Injects content into the game modal and displays it.
	 * @param {string} html - The raw HTML string to insert into the modal.
	 */
	displayContentInModal(html) {
		LayeredInput.activate(LayeredInput.LAYER_GAME_MODAL);

		this.elements.gameModalContent.innerHTML = html;

		const scrollables = this.elements.gameModalContent.querySelectorAll(
			'pre code, .embed-container'
		);
		scrollables.forEach((el) => el.setAttribute('tabindex', '0'));

		Obfuscator.processDomElements(this.elements.gameModalContent);

		InputPrompts.refresh(this.elements.gameModalContent);

		if (!this.elements.gameModal.open) {
			this.app.setLock(true);
			Navigation.setContext(this.elements.gameModalContent, { scroll: true, axis: null });
			this.elements.gameModal.showModal();
		}

		this.elements.gameModalContent.focus({ focusVisible: false });

		scrollToHash(window.location.hash, this.elements.gameModalContent, 'auto');
	}

	/**
	 * Injects content into the text-mode view.
	 * @param {string} html - The raw HTML string to insert into the view.
	 */
	displayContentInTextView(html) {
		this.elements.textContent.innerHTML = html;

		const scrollables = this.elements.textContent.querySelectorAll(
			'pre code, .embed-container'
		);
		scrollables.forEach((el) => el.setAttribute('tabindex', '0'));

		Obfuscator.processDomElements(this.elements.textContent);

		if (this.elements.textLayer) {
			this.elements.textLayer.scrollTop = 0;
		}

		this.elements.textContent.focus({ preventScroll: true, focusVisible: false });

		if (this.elements.tableOfContents) {
			this.elements.tableOfContents.innerHTML = '';
			this.elements.tableOfContents.hidden = true;
		}

		const headingsTree = this.#getHeadingsTree(this.elements.textContent);
		if (headingsTree.complexity > UIManager.TABLE_OF_CONTENTS_COMPLEXITY_THRESHOLD) {
			this.#displayTableOfContents(headingsTree.headings);
		}

		scrollToHash(window.location.hash, this.elements.textContent, 'auto');
	}

	/**
	 * Enables or disables the 'Return to Start' menu item.
	 * @param {boolean} disabled - Whether the button should be disabled.
	 */
	setResetButtonState(disabled) {
		if (this.elements.gameResetButton) {
			this.elements.gameResetButton.disabled = disabled;
		}
	}

	/**
	 * Displays a localized 404 error page inside the text view.
	 */
	render404() {
		if (this.elements.textLayer) {
			this.elements.textLayer.scrollTop = 0;
		}

		if (this.elements.textNav && this.elements.tmpl404Breadcrumbs) {
			this.elements.textNav.innerHTML = '';
			const clone = this.elements.tmpl404Breadcrumbs.content.cloneNode(true);
			const link = clone.querySelector('a');
			if (link) {
				link.href = `/${this.app.mode}`;
			}
			this.elements.textNav.appendChild(clone);
			Lang.performTranslation(this.elements.textNav);
		}

		if (this.elements.textContent && this.elements.tmpl404Content) {
			this.elements.textContent.innerHTML = '';
			const clone = this.elements.tmpl404Content.content.cloneNode(true);
			this.elements.textContent.appendChild(clone);
			Lang.performTranslation(this.elements.textContent);
		}

		if (this.elements.tableOfContents) {
			this.elements.tableOfContents.innerHTML = '';
			this.elements.tableOfContents.hidden = true;
		}
	}

	/**
	 * Processes gamepad and axis input for horizontal submenu navigation.
	 * @param {Object} inputState - The current state of the Input module.
	 */
	handleSubmenuInput(inputState) {
		const axis = inputState.axis;
		const now = performance.now();

		if (now - this.lastSubmenuMoveTime < Navigation.constructor.NAV_DEBOUNCE) {
			return;
		}

		const current = document.activeElement;
		if (!current) {
			return;
		}

		// Right to open
		if (axis.x > Navigation.constructor.NAVIGATE_DEADZONE) {
			if (current.getAttribute('aria-haspopup') === 'menu') {
				this.lastSubmenuMoveTime = now;
				this.toggleSubmenu(current, true);
			}
		}
		// Left to close
		else if (axis.x < -Navigation.constructor.NAVIGATE_DEADZONE) {
			// If on an open trigger, close it
			if (
				current.getAttribute('aria-haspopup') === 'menu'
				&& current.getAttribute('aria-expanded') === 'true'
			) {
				this.lastSubmenuMoveTime = now;
				this.toggleSubmenu(current, false);
				return;
			}

			// Check if we are inside a submenu
			const submenu = current.closest('[role="menu"]');
			if (submenu && submenu.id && submenu.id.endsWith('submenu')) {
				const trigger = document.querySelector(`[aria-controls="${submenu.id}"]`);
				if (trigger) {
					this.lastSubmenuMoveTime = now;
					this.toggleSubmenu(trigger, false);
					trigger.focus();
				}
			}
		}
	}
}
