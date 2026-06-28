import { Router } from './modules/router.js';
import { Events } from './modules/events.js';
import { GameBridge } from './modules/gameBridge.js';
import { UIManager } from './modules/uiManager.js';
import { Content } from './modules/content.js';
import { ContentTree } from './modules/contentTree.js';
import { Interaction } from './modules/interaction.js';
import { Lang } from './modules/lang.js';
import { Input } from './modules/input.js';
import { LayeredInput } from './modules/layeredInputs.js';
import { Navigation } from './modules/navigation.js';
import { TextRenderer } from './modules/textRenderer.js';
import { TutorialManager } from './modules/tutorialManager.js';
import { MarkedExtensions } from './modules/markedExtensions.js';
import { GalleryDisplay } from './modules/gallery.js';
import { Meta } from './modules/meta.js';

/**
 * Manages high-level application state, routing, and ecosystem orchestration.
 */
class AppController {
	/**
	 * @property {Object} LJS - The LittleJS engine namespace, set after dynamic import.
	 * @property {boolean} isPaused - Whether the game engine is actively running and rendering.
	 * @property {boolean} isLocked - Whether the game engine should block inputs and interactions.
	 * @property {Map<string, string>} contentCache - Caches fetched markdown content as HTML, keyed by `${langCode}:${filename}`.
	 * @property {ContentTree|null} currentMapId - The root of the content tree, initialized after content loading.
	 * @property {Object|null} pendingStartPos - The currently active LittleJS engine namespace, set after dynamic import.
	 * @property {number|undefined} pendingEntryX - If set, indicates a pending X coordinate for player entry on the next map load.
	 * @property {TextRenderer|null} textRenderer - Responsible for rendering text-mode content, initialized after core setup.
	 * @property {TutorialManager|null} tutorialManager - Handles tutorial state and display logic, initialized after core setup.
	 * @property {UIManager|null} uiManager - Manages all UI elements, interactions, and mode transitions, initialized after core setup.
	 * @property {GalleryDisplay|null} galleryDisplay - Manages the gallery display, initialized after core setup.
	 * @property {Input} Input - Centralized input controller instance, initialized immediately.
	 * @property {MetaController} Meta - Centralized metadata manager, initialized immediately.
	 * @property {boolean} isLocal - Indicates whether the app is running in a local development environment.
	 */
	constructor() {
		this.isPaused = false;
		this.isLocked = false;

		// Content Cache
		this.contentCache = new Map();
		this.currentMapId = null;
		this.pendingStartPos = null;
		this.pendingEntryX = undefined;

		// Delegated subsystems
		this.textRenderer = null;
		this.tutorialManager = null;
		this.uiManager = null;
		this.galleryDisplay = null;

		// Input bridge
		this.Input = Input;

		// Meta manager
		this.Meta = Meta;

		this.isLocal =
			window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
	}

	/**
	 * Returns the LittleJS canvas element.
	 * @returns {HTMLCanvasElement|null} the active game canvas or null if not yet created.
	 */
	get canvas() {
		return this.uiManager.canvas;
	}

	/**
	 * Returns the current active mode.
	 * @returns {string} either `game` or `text`.
	 */
	get mode() {
		return Router.currentMode;
	}

	/**
	 * `true` if the application is in `game` mode and not paused.
	 * @returns {boolean} whether the game engine is actively updating/rendering.
	 */
	get isRunning() {
		return Router.currentMode === 'game' && !this.isPaused;
	}

	/**
	 * Returns the current position vector of the player from the GameBridge.
	 * @returns {Object|null} a vector object with `{x, y}` properties.
	 */
	get playerPos() {
		return GameBridge.playerPos;
	}

	/**
	 * Performs core initialization of libraries, modules, and application state.
	 * @returns {Promise<void>} (resolves) when all core systems are ready.
	 */
	async init() {
		// Initialize UI Manager
		this.uiManager = new UIManager(this);

		// Start by showing loading (it should be visible by default in HTML, but just in case)
		this.uiManager.showLoading(true);

		// Activate the default base layer (overridden by Router if necessary)
		LayeredInput.activate(LayeredInput.LAYER_GAME);

		try {
			const langPromise = Lang.init();
			const contentPromise = Content.init();

			const [
				littleModule,
				{ marked },
				{ gfmHeadingId },
				markedAlertModule,
				markedResponsiveImagesModule,
			] = await Promise.all([
				import('$littlejs'),
				import('marked'),
				import('marked-gfm-heading-id'),
				import('marked-alert'),
				import('marked-responsive-images'),
			]);

			this.LJS = (littleModule && (littleModule.default || littleModule)) || null;

			// Overrides LittleJS' global 'contextmenu' handler to restore the native context menu while in text mode.
			document.addEventListener(
				'contextmenu',
				(e) => {
					if (e.target !== this.canvas) {
						e.stopImmediatePropagation();
					}
				},
				true
			);

			if (marked) {
				this.marked = marked;

				new MarkedExtensions(this.marked).setup({
					gfmHeadingId,
					markedAlert: markedAlertModule.default || markedAlertModule.markedAlert,
					markedResponsiveImages:
						markedResponsiveImagesModule.default
						|| markedResponsiveImagesModule.markedResponsiveImages,
				});
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

			// Initialize Gallery modal display
			this.galleryDisplay = new GalleryDisplay(this);

			// Ensure all scripts are loaded
			this.Lang = Lang;
			await Promise.all([langPromise, contentPromise]);

			// Listen for route changes
			Events.on('route:changed', async (payload) => {
				if (payload.mode === 'game') {
					await this.#handleGameTransition(payload);
				}
			});

			// Initialize Router which will trigger the first onStateChange
			await Router.init(this.onStateChange.bind(this));

			// Accessibility media queries listener
			const accessibilityQuery = window.matchMedia(
				'(forced-colors: active), (prefers-contrast: more)'
			);
			accessibilityQuery.addEventListener('change', () => this.#syncGameFont());

			// If this is a fresh entry (root path), show the welcome screen
			const pathName = window.location.pathname.replace(/^\/|\/$/g, '');
			const searchParams = new URLSearchParams(window.location.search);
			if ((pathName === '' || pathName === 'index.html') && !searchParams.has('mode')) {
				// TEMP TEXT-ONLY START
				if (
					window.location.hostname === 'localhost'
					|| window.location.hostname === '127.0.0.1'
				) {
					// TEMP TEXT-ONLY END
					this.openGameWelcome();
					// TEMP TEXT-ONLY START
				}
				// TEMP TEXT-ONLY END
			}

			// TEMP TEXT-ONLY START
			if (
				window.location.hostname === 'localhost'
				|| window.location.hostname === '127.0.0.1'
			) {
				document.body.classList.add('isLocal');
			}
			// TEMP TEXT-ONLY END

			// Finally hide loading with a fade
		} catch (error) {
			console.error('Core initialization failed:', error);
		}
		await this.uiManager.hideLoading(true);
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
	 * @returns {Promise<string>} the parsed HTML content of the markdown file.
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
			 * @param {string} url - The URL to fetch.
			 * @returns {Promise<Response|null>} the response if valid, null otherwise.
			 */
			const getValidResponse = async (url) => {
				const cacheBuster = `?v=${window.__CACHE_BUSTER__ || Date.now()}`;
				const fullUrl = url + cacheBuster;

				// Check if this URL was preloaded
				let res;
				if (window.__PRELOADED_CONTENT__ && window.__PRELOADED_CONTENT__.url === fullUrl) {
					res = await window.__PRELOADED_CONTENT__.promise;
					// Avoid reuse of preloaded response
					window.__PRELOADED_CONTENT__ = null;
				}

				if (!res) {
					res = await fetch(fullUrl);
				}

				if (!res) {
					return null;
				}

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
			const html = this.marked ? await this.marked.parse(rawMarkdown) : rawMarkdown;

			this.contentCache.set(cacheKey, html);

			return html;
		} catch (error) {
			console.error(`Content fetch failed for ${filename}:`, error);
			return `<p class="error">Error loading "${filename}".</p>`;
		}
	}

	/**
	 * Handles high-level game mode transitions.
	 * @param {Object} payload - The route:changed event payload.
	 * @param {string} payload.path - The path of the route.
	 * @param {Object} payload.node - The content node associated with the path.
	 * @private
	 */
	async #handleGameTransition({ path, node }) {
		try {
			const mapNode = Content.getParentMapNode(path);

			if (mapNode && mapNode.mapData) {
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
			}

			if (node && node.type === 'content' && node.file) {
				await this.loadContentInModal(node.file);
			} else {
				if (this.uiManager.elements.gameModal.open) {
					this.uiManager.elements.gameModal.close();
				}
			}

			if (
				this.uiManager.elements.loadingOverlay
				&& !this.uiManager.elements.loadingOverlay.classList.contains('hidden')
			) {
				await this.uiManager.hideLoading(false);
			}
		} catch (error) {
			console.error('Failed to transition game state:', error);
			this.uiManager.hideLoading(false);
		}
	}

	/**
	 * Synchronizes the visibility of interaction elements based on pause/lock state.
	 * @private
	 */
	#syncPauseUI() {
		const hidden = this.isPaused || this.isLocked;
		this.uiManager.elements.gameMenuButton?.classList.toggle('hidden', hidden);
		this.uiManager.elements.touchControls?.classList.toggle('hidden', hidden);
	}

	/**
	 * Processes global input actions like menu toggling and back navigation.
	 */
	handleInput() {
		// UI Layers
		if (this.uiManager.handleInput(this.Input)) {
			return;
		}

		// Gallery Layer
		if (this.galleryDisplay.handleInput(this.Input)) {
			return;
		}

		// Tutorial Layer
		if (this.tutorialManager.handleInput(this.Input)) {
			return;
		}

		// Game logic layer
		if (LayeredInput.isActive(LayeredInput.LAYER_GAME)) {
			if (this.Input.menu || this.Input.back) {
				this.openGameMenu();
				return;
			}
		}
	}

	/**
	 * Relocates the player to the specified coordinates.
	 * @param {Object} pos - The target coordinates in `{x, y}` format.
	 * @returns {Promise<void>} (resolves) when the player has been teleported.
	 */
	teleportPlayer(pos) {
		return GameBridge.teleportPlayer(pos);
	}

	/**
	 * Core routing callback that handles mode transitions and content loading when the URL changes.
	 * @param {Object} state - The new state object containing `{ mode, path }`.
	 */
	async onStateChange(state) {
		const { mode, path } = state;

		// Delegate mode switching to UI Manager
		this.uiManager.setMode(mode);

		// Swap the base input layer
		if (mode === 'game') {
			LayeredInput.deactivate(LayeredInput.LAYER_TEXT);
			LayeredInput.activate(LayeredInput.LAYER_GAME);
		} else {
			LayeredInput.deactivate(LayeredInput.LAYER_GAME);
			LayeredInput.activate(LayeredInput.LAYER_TEXT);
		}

		if (mode === 'game') {
			this.setPause(false);
		} else {
			this.setPause(true);
		}

		const node = Content.findNodeByPath(path);

		if (!node && path !== '' && !Router.isBlogRoute) {
			if (mode === 'game') {
				Router.go('game', '');
				return;
			} else {
				this.uiManager.render404();
				return;
			}
		}

		Events.emit('route:changed', { mode, path, node });
	}

	/**
	 * Pauses or unpauses game physics and updates UI visibility.
	 * @param {boolean} state - `true` to pause the app, `false` to resume.
	 */
	setPause(state) {
		this.isPaused = state;
		this.#syncPauseUI();
	}

	/**
	 * Locks or unlocks game interactions (animations still run).
	 * @param {boolean} state - `true` to lock, `false` to unlock.
	 */
	setLock(state) {
		this.isLocked = state;
		this.#syncPauseUI();
	}

	/**
	 * Changes the application mode via the Router.
	 * @param {string} mode - The target mode, either `game` or `text`.
	 */
	setMode(mode) {
		this.setPause(false);
		this.setLock(false);

		if (mode === 'game' && Router.isBlogRoute) {
			Router.go('game', '');
			return;
		}

		Router.go(mode, Router.currentPath);
	}

	/**
	 * Updates the content path within the current mode via the Router.
	 * @param {string} path - The relative path to navigate to.
	 */
	navigate(path) {
		let hash = '';
		let targetPath = path;
		const hashIndex = path.indexOf('#');
		if (hashIndex !== -1) {
			hash = path.substring(hashIndex);
			targetPath = path.substring(0, hashIndex);
		}

		Router.go(Router.currentMode, targetPath, hash);
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
	 * @returns {Promise<void>} (resolves) when the modal has been updated and displayed.
	 */
	async loadContentInModal(filename) {
		const langCode = Lang.langCode;
		const cacheKey = `${langCode}:${filename}`;

		const needsLoading = !this.contentCache.has(cacheKey);
		if (needsLoading) {
			this.uiManager.showLoading(false, true);
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
	 * @param {string|null} [wrapper=null] - Optional HTML element name to wrap the content in.
	 * @returns {Promise<void>} (resolves) when the text view has been updated.
	 */
	async loadContentIntoText(filename, wrapper = null) {
		const langCode = Lang.langCode;
		const cacheKey = `${langCode}:${filename}`;

		const needsLoading = !this.contentCache.has(cacheKey);
		if (needsLoading) {
			this.uiManager.showLoading(true);
		}

		let html = await this.#fetchContent(filename);

		if (wrapper) {
			html = `<${wrapper}>${html}</${wrapper}>`;
		}

		this.uiManager.displayContentInTextView(html);

		if (needsLoading) {
			await this.uiManager.hideLoading(true);
		}
	}

	/**
	 * Opens the initial welcome/help modal.
	 */
	openGameWelcome() {
		LayeredInput.activate(LayeredInput.LAYER_GAME_WELCOME);
		this.uiManager.openGameWelcome();
	}

	/**
	 * Closes the welcome modal and enters the specified mode.
	 * @param {string} mode - The mode to transition to after closing, usually `game` or `text`.
	 */
	closeGameWelcome(mode) {
		LayeredInput.deactivate(LayeredInput.LAYER_GAME_WELCOME);
		this.uiManager.closeGameWelcome();
		this.setMode(mode);
	}

	/**
	 * Opens the main in-game navigation menu.
	 */
	openGameMenu() {
		this.setPause(true);
		LayeredInput.activate(LayeredInput.LAYER_GAME_MENU);

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
		LayeredInput.deactivate(LayeredInput.LAYER_GAME_MENU);
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
		this.setLock(false);

		// Clean up any sub-modals that might still be open in the navigation stack
		while (Navigation.contextStack.length > 0) {
			const active = Navigation.activeContainer;
			if (active instanceof HTMLDialogElement) {
				active.close();
			} else {
				Navigation.popContext();
			}
		}

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
