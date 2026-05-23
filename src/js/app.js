import { Router } from './modules/router.js';
import { Content, ContentTree } from './modules/content.js';
import { Interaction } from './modules/interaction.js';
import { Lang } from './modules/lang.js';
import { Input } from './modules/input.js';
import { Navigation } from './modules/navigation.js';
import { GameBridge } from './modules/gameBridge.js';
import { TextRenderer } from './modules/textRenderer.js';
import { TutorialManager } from './modules/tutorialManager.js';
import { UIManager } from './modules/uiManager.js';
import { MarkedExtensions } from './modules/markedExtensions.js';

/**
 * Manages high-level application state, routing, and ecosystem orchestration.
 */
class AppController {
	constructor() {
		/** @type {Object} LJS - The LittleJS engine namespace, set after dynamic import. */
		this.isPaused = false;

		// Content Cache
		/** @type {Map<string, string>} Caches fetched markdown content as HTML, keyed by `${langCode}:${filename}`. */
		this.contentCache = new Map();
		/** @type {ContentTree|null} The root of the content tree, initialized after content loading. */
		this.currentMapId = null;
		/** @type {Object|null} The currently active LittleJS engine namespace, set after dynamic import. */
		this.pendingStartPos = null;
		/** @type {number|undefined} If set, indicates a pending X coordinate for player entry on the next map load. */
		this.pendingEntryX = undefined;

		// Delegated subsystems
		/** @type {TextRenderer|null} Responsible for rendering text-mode content, initialized after core setup. */
		this.textRenderer = null;
		/** @type {TutorialManager|null} Handles tutorial state and display logic, initialized after core setup. */
		this.tutorialManager = null;
		/** @type {UIManager|null} Manages all UI elements, interactions, and mode transitions, initialized after core setup. */
		this.uiManager = null;

		// Input bridge
		/** @type {Input} Centralized input controller instance, initialized immediately. */
		this.Input = Input;

		/** @type {boolean} Indicates whether the app is running in a local development environment. */
		this.isLocal =
			window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
	}

	/**
	 * Returns the LittleJS canvas element.
	 * @returns {HTMLCanvasElement|null} The active game canvas or null if not yet created.
	 */
	get canvas() {
		return this.uiManager.canvas;
	}

	/**
	 * Returns the current active mode.
	 * @returns {string} Either `game` or `text`.
	 */
	get mode() {
		return Router.currentMode;
	}

	/**
	 * `true` if any modal, overlay, or menu is currently active.
	 * @returns {boolean} Whether the UI is currently blocking game input.
	 */
	get menuOpen() {
		return this.uiManager.menuOpen;
	}

	/**
	 * `true` if the application is in `game` mode and not paused.
	 * @returns {boolean} Whether the game engine is actively updating/rendering.
	 */
	get isRunning() {
		return Router.currentMode === 'game' && !this.isPaused;
	}

	/**
	 * Returns the current position vector of the player from the GameBridge.
	 * @returns {Object|null} A vector object with `{x, y}` properties.
	 */
	get playerPos() {
		return GameBridge.playerPos;
	}

	/**
	 * Performs core initialization of libraries, modules, and application state.
	 * @returns {Promise<void>} Resolves when all core systems are ready.
	 */
	async init() {
		// Initialize UI Manager
		this.uiManager = new UIManager(this);

		// Start by showing loading (it should be visible by default in HTML, but just in case)
		this.uiManager.showLoading();

		try {
			const markedSrc = '/vendor/marked.min.js';
			const markedHeadingIdSrc = '/vendor/marked-gfm-heading-id.min.js';
			const markedAlertSrc = '/vendor/marked-alert.min.js';
			const markedResponsiveImagesSrc = '/vendor/marked-responsive-images.min.js';

			const langPromise = Lang.init();
			const contentPromise = Content.init();

			const librariesPromise = Promise.all([
				import('$littlejs'),
				this.#loadScript(markedSrc),
				this.#loadScript(markedHeadingIdSrc),
				this.#loadScript(markedAlertSrc),
				this.#loadScript(markedResponsiveImagesSrc),
			]);

			const [littleModule] = await librariesPromise;

			this.LJS = (littleModule && (littleModule.default || littleModule)) || null;

			// Overrides LittleJS' global 'contextmenu' handler to restore the native context menu while in text mode.
			document.addEventListener(
				'contextmenu',
				(e) => {
					if (this.mode === 'text') {
						e.stopImmediatePropagation();
					}
				},
				true,
			);

			if (typeof marked !== 'undefined') {
				this.marked = marked;
				new MarkedExtensions(this.marked).setup();
			}

			await import('./game.js');

			this.#syncGameFont();

			this.Input.initTouch(this.uiManager.elements.touchControls);

			// Initialize delegated managers
			this.textRenderer = new TextRenderer(this);
			this.tutorialManager = new TutorialManager(this);
			this.tutorialManager.init();

			// Initialize UI Manager (event listeners, etc.)
			this.uiManager.init();

			// Ensure all scripts are loaded
			this.Lang = Lang;
			await Promise.all([langPromise, contentPromise]);

			// Initialize Router which will trigger the first onStateChange
			Router.init(this.onStateChange.bind(this));

			// Accessibility media queries listener
			const accessibilityQuery = window.matchMedia(
				'(forced-colors: active), (prefers-contrast: more)',
			);
			accessibilityQuery.addEventListener('change', () => this.#syncGameFont());

			// If this is a fresh entry (root path), show the welcome screen
			const pathName = window.location.pathname.replace(/^\/|\/$/g, '');
			const searchParams = new URLSearchParams(window.location.search);
			if ((pathName === '' || pathName === 'index.html') && !searchParams.has('mode')) {
				this.uiManager.openGameWelcome();
			}

			// Finally hide loading with a fade
		} catch (error) {
			console.error('Core initialization failed:', error);
		}
		await this.uiManager.hideLoading(true);
	}

	/**
	 * Injects a `<script>` tag into the document head.
	 * @param {string} src - The source URL of the script to load.
	 * @returns {Promise<void>} Resolves when the script has finished loading.
	 * @private
	 */
	#loadScript(src) {
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = src;
			script.onload = resolve;
			script.onerror = reject;
			document.head.appendChild(script);
		});
	}

	/**
	 * Synchronizes the LittleJS engine font with the `--font-mono` CSS variable.
	 * @private
	 */
	#syncGameFont() {
		const rootStyle = getComputedStyle(document.documentElement);
		const preferredFont = rootStyle.getPropertyValue('--font-mono').trim();
		this.LJS.setFontDefault(preferredFont);
	}

	/**
	 * Fetches markdown content from the server, handles localization fallbacks, and caches results as HTML.
	 * @param {string} filename - The relative path (from `/content/`) to the markdown file.
	 * @returns {Promise<string>} The parsed HTML content of the markdown file.
	 * @private
	 */
	async #fetchContent(filename) {
		const langCode = Lang.langCode;
		const cacheKey = `${langCode}:${filename}`;

		if (this.contentCache.has(cacheKey)) {
			return this.contentCache.get(cacheKey);
		}

		try {
			/**
			 * Helper to check if a response is a valid markdown file.
			 * We check status, content-type, and also peek at the body to avoid SPA HTML fallbacks.
			 */
			const getValidResponse = async (url) => {
				const cacheBuster = `?v=${Date.now()}`;
				const res = await fetch(url + cacheBuster);
				const contentType = res.headers.get('content-type') || '';

				if (!res.ok) {
					console.warn(`Content: Rejected ${url} - Status ${res.status}`);
					return null;
				}

				if (contentType.includes('text/html') || contentType.includes('application/json')) {
					console.warn(`Content: Rejected ${url} - Invalid Content-Type: ${contentType}`);
					return null;
				}

				const clone = res.clone();
				const text = await clone.text();
				if (!text) {
					console.warn(`Content: Rejected ${url} - Empty body`);
					return null;
				}

				const trimmed = text.trim().toLowerCase();
				if (
					trimmed.startsWith('<!doctype')
					|| trimmed.startsWith('<html')
					|| trimmed.includes('id="game-layer"')
				) {
					console.warn(`Content: Rejected ${url} - Detected SPA HTML fallback.`);
					return null;
				}
				return res;
			};

			let response = await getValidResponse(`/content/${langCode}/${filename}`);

			if (!response && langCode !== 'en_US') {
				response = await getValidResponse(`/content/en_US/${filename}`);
			}

			if (!response) {
				throw new Error(`File "${filename}" not found or returned invalid content.`);
			}

			const rawMarkdown = await response.text();
			const html = this.marked ? this.marked.parse(rawMarkdown) : rawMarkdown;

			this.contentCache.set(cacheKey, html);

			return html;
		} catch (error) {
			console.error(`Content fetch failed for ${filename}:`, error);
			return `<p class="error">Error loading "${filename}".</p>`;
		}
	}

	/**
	 * Processes global input actions like menu toggling and back navigation.
	 */
	handleInput() {
		if (this.mode !== 'game') {
			return;
		}

		if (this.menuOpen) {
			Navigation.update(this.Input);
			this.uiManager.handleSubmenuInput(this.Input);
		}

		if (this.Input.menu) {
			if (this.uiManager.elements.gameWelcome?.open) {
				return;
			}

			if (this.uiManager.elements.gameMenu?.open) {
				this.closeGameMenu();
			} else if (this.uiManager.elements.gameModal?.open) {
				this.closeGameModal();
			} else if (!this.uiManager.elements.loadingOverlay?.classList.contains('opaque')) {
				this.openGameMenu();
			}
		}

		if (this.Input.back) {
			if (this.uiManager.elements.gameMenu?.open) {
				this.closeGameMenu();
				return;
			}
			if (this.uiManager.elements.gameModal?.open) {
				this.closeGameModal();
				return;
			}
			if (
				this.uiManager.elements.touchInstructions
				&& !this.uiManager.elements.touchInstructions.classList.contains('hidden')
			) {
				this.tutorialManager.closeTouchInstructions();
				return;
			}
		}
	}

	/**
	 * Relocates the player to the specified coordinates.
	 * @param {Object} pos - The target coordinates in `{x, y}` format.
	 */
	teleportPlayer(pos) {
		return GameBridge.teleportPlayer(pos);
	}

	/**
	 * Core routing callback that handles mode transitions and content loading when the URL changes.
	 * @param {Object} state - The new state object containing `{ mode, path }`.
	 */
	onStateChange(state) {
		const { mode, path } = state;

		// Delegate mode switching to UI Manager
		this.uiManager.setMode(mode);

		if (mode === 'game') {
			this.setPause(false);
			this.tutorialManager?.tryShowTouchTutorial();
		} else {
			this.setPause(true);
		}

		const node = Content.findNodeByPath(path);

		if (!node && path !== '') {
			if (mode === 'game') {
				Router.go('game', '');
				return;
			} else {
				this.uiManager.render404();
				return;
			}
		}

		if (mode === 'game') {
			const mapNode = Content.getParentMapNode(path);

			if (mapNode && mapNode.mapData) {
				const pathParts = path.split('/').filter((p) => p);
				const isContent = node && node.type === 'content';
				const mapPath = isContent ? pathParts.slice(0, -1).join('/') : path;

				const currentObjects = Content.buildMapObjects(mapNode, mapPath);

				if (mapNode.id !== 'root') {
					const parentPath = mapPath.split('/').slice(0, -1).join('/');

					currentObjects.push({
						id: 'parent_exit',
						pos: mapNode.mapData.startPos,
						radius: 1.5,
						label: 'Exit Area',
						path: parentPath,
						below: true,
					});
				}

				const gameObjects = currentObjects.map((obj) => {
					return {
						id: obj.id,
						pos: App.LJS.vec2(obj.pos.x, obj.pos.y),
						radius: obj.radius,
						file: obj.file,
						label: obj.label,
						path: obj.path,
						below: obj.below,
					};
				});

				Interaction.setObjects(gameObjects);

				if (this.currentMapId !== mapNode.id) {
					this.currentMapId = mapNode.id;
					let desiredStart = mapNode.mapData.startPos;
					if (
						this.pendingEntryX !== undefined
						&& typeof this.pendingEntryX === 'number'
					) {
						desiredStart = {
							x: this.pendingEntryX,
							y: mapNode.mapData.startPos.y,
						};
						this.pendingEntryX = undefined;
					}
					this.pendingStartPos = desiredStart;
					this.teleportPlayer(desiredStart);
				}
			} else {
				Interaction.setObjects([]);
			}

			if (node && node.type === 'content' && node.file) {
				this.loadContentInModal(node.file);
			} else {
				if (this.uiManager.elements.gameModal.open) {
					this.uiManager.elements.gameModal.close();
				}
			}

			if (
				this.uiManager.elements.loadingOverlay
				&& !this.uiManager.elements.loadingOverlay.classList.contains('hidden')
			) {
				this.uiManager.hideLoading(false).catch(() => {});
			}
		} else {
			this.textRenderer.render(Router.currentPath, node);

			// If we are at a specific content node, show it
			if (node && node.type === 'content' && node.file) {
				this.loadContentIntoText(node.file);
			} else if (node && node.type === 'category') {
				// Check if the category has a main file
				let mainChild = null;
				if (node.id === 'root') {
					mainChild = node.children.find((c) => c.id === 'index');
				} else {
					mainChild = node.children.find((c) => c.id === node.id);
				}

				if (mainChild && mainChild.file) {
					this.loadContentIntoText(mainChild.file);
				} else {
					this.uiManager.elements.textContent.innerHTML = '';
				}
			} else {
				this.uiManager.elements.textContent.innerHTML = '';
			}

			const navButtons = document.querySelectorAll('#text-navbar button[data-nav-path]');
			for (const navButton of navButtons) {
				const isCurrent = navButton.dataset.navPath === path;
				navButton.disabled = isCurrent;
				if (isCurrent) {
					navButton.setAttribute('aria-current', 'page');
				} else {
					navButton.removeAttribute('aria-current');
				}
			}
		}
	}

	/**
	 * Pauses or unpauses game physics and updates UI visibility.
	 * @param {boolean} state - `true` to pause the app, `false` to resume.
	 */
	setPause(state) {
		this.isPaused = state;
		this.uiManager.elements.gameMenuButton?.classList.toggle('hidden', state);
		this.uiManager.elements.touchControls?.classList.toggle('hidden', state);
	}

	/**
	 * Changes the application mode via the Router.
	 * @param {string} mode - The target mode, either `game` or `text`.
	 */
	setMode(mode) {
		Router.go(mode, Router.currentPath);
	}

	/**
	 * Updates the content path within the current mode via the Router.
	 * @param {string} path - The relative path to navigate to.
	 */
	navigate(path) {
		Router.go(Router.currentMode, path);
	}

	/**
	 * Toggles high-contrast/readability styling.
	 * @param {boolean|null} [forceState=null] - Optional boolean to force a state, otherwise toggles current.
	 */
	toggleReadabilityMode(forceState = null) {
		this.uiManager.toggleReadabilityMode(forceState);
	}

	/**
	 * Toggles the visibility of a specified submenu.
	 * @param {HTMLElement} trigger - The button element that controls the submenu.
	 * @param {boolean|null} [forceState=null] - Optional boolean to force open (`true`) or closed (`false`).
	 */
	toggleSubmenu(trigger, forceState = null) {
		this.uiManager.toggleSubmenu(trigger, forceState);
	}

	/**
	 * Loads and displays markdown content within the game's modal overlay.
	 * @param {string} filename - The name of the file within the content directory.
	 * @returns {Promise<void>} Resolves when the modal has been updated and displayed.
	 */
	async loadContentInModal(filename) {
		const langCode = Lang.langCode;
		const cacheKey = `${langCode}:${filename}`;

		const needsLoading = !this.contentCache.has(cacheKey);
		if (needsLoading) {
			this.uiManager.showLoading();
		}

		const html = await this.#fetchContent(filename);

		this.uiManager.displayContentInModal(html);

		if (needsLoading) {
			await this.uiManager.hideLoading(false);
		}
	}

	/**
	 * Loads and displays markdown content within the text-mode container.
	 * @param {string} filename - The name of the file within the content directory.
	 * @returns {Promise<void>} Resolves when the text view has been updated.
	 */
	async loadContentIntoText(filename) {
		const langCode = Lang.langCode;
		const cacheKey = `${langCode}:${filename}`;

		const needsLoading = !this.contentCache.has(cacheKey);
		if (needsLoading) {
			this.uiManager.showLoading(true);
		}

		const html = await this.#fetchContent(filename);

		this.uiManager.displayContentInTextView(html);

		if (needsLoading) {
			await this.uiManager.hideLoading(true);
		}
	}

	/**
	 * Opens the initial welcome/help modal.
	 */
	openGameWelcome() {
		this.uiManager.openGameWelcome();
	}

	/**
	 * Closes the welcome modal and enters the specified mode.
	 * @param {string} mode - The mode to transition to after closing, usually `game` or `text`.
	 */
	closeGameWelcome(mode) {
		this.uiManager.closeGameWelcome();
		this.setMode(mode);
	}

	/**
	 * Opens the main in-game navigation menu.
	 */
	openGameMenu() {
		this.setPause(true);

		// Calculate reset button state
		if (this.uiManager.elements.gameResetButton) {
			const isRoot = Router.currentPath === '';
			const playerPos = this.playerPos;
			const rootStartPos = ContentTree.mapData.startPos;

			let shouldDisable = false;
			if (isRoot && playerPos) {
				const dx = playerPos.x - rootStartPos.x;
				const dy = playerPos.y - rootStartPos.y;
				const distanceSq = dx * dx + dy * dy;
				if (distanceSq < 3 * 3) {
					shouldDisable = true;
				}
			}

			this.uiManager.setResetButtonState(shouldDisable);
		}

		this.uiManager.openGameMenu();
	}

	/**
	 * Resets the player to the starting location or home path.
	 */
	returnToStart() {
		this.closeGameMenu();
		if (Router.currentPath === '') {
			// Already at root, just teleport to start
			this.teleportPlayer(ContentTree.mapData.startPos);
		} else {
			this.navigate('');
		}
	}

	/**
	 * Closes the in-game menu and resumes play.
	 */
	closeGameMenu() {
		this.uiManager.closeGameMenu();

		this.Input.clearEvents();
		Interaction.setBlock(200);

		if (this.mode === 'game') {
			this.setPause(false);
		}
	}

	/**
	 * Closes the active content modal.
	 */
	closeGameModal() {
		this.uiManager.closeGameModal();
	}

	/**
	 * Unified cleanup callback triggered when any modal or menu is dismissed.
	 * @param {boolean} [focusGame='true'] - If `true`, returns focus to the game canvas.
	 */
	onModalClose(focusGame = true) {
		// Only unpause if we are in game mode and no other modals are open
		if (Router.currentMode !== 'game') {
			return;
		}

		this.setPause(false);

		this.Input.clearEvents();
		Interaction.setBlock(200);

		// Focus the canvas so keyboard input goes back to the game engine
		if (focusGame && this.canvas) {
			this.canvas.focus({ focusVisible: false });
		}
	}
}

// Export a singleton instance for shared state across all modules
export const App = new AppController();
