import { sanitizePath, scrollToHash } from './sharedUtils.js';

/**
 * Handles application state based on URL paths and using the History API.
 */
class RouterController {
	/**
	 * The internal application state { mode, path }.
	 * @type {Object}
	 */
	state = {
		mode: 'game',
		path: '',
	};

	/**
	 * URL or state change challback.
	 * @type {Function|null}
	 */
	onStateChange = null;

	constructor() {
		window.addEventListener('popstate', (event) => {
			if (event.state) {
				if (event.state.mode === this.state.mode && event.state.path === this.state.path) {
					return;
				}
				this.applyState(event.state);
			} else {
				const parsed = this.#parsePathname(window.location.pathname);
				if (parsed.mode === this.state.mode && parsed.path === this.state.path) {
					return;
				}
				this.applyState(parsed);
			}
		});

		window.addEventListener('hashchange', () => scrollToHash(window.location.hash));
	}

	/**
	 * @returns {string} the current path.
	 */
	get currentPath() {
		return this.state.path;
	}

	/**
	 * @returns {string} the current mode (`game` or `text`).
	 */
	get currentMode() {
		return this.state.mode;
	}

	/**
	 * @returns {boolean} hether the current path is for a blog page.
	 */
	get isBlogRoute() {
		return this.state.path.startsWith('blog');
	}

	/**
	 * @returns {boolean} Whether the current path is for a project page.
	 */
	get isProjectRoute() {
		return this.state.path.startsWith('projects');
	}

	/**
	 * Initializes the router and reads the initial URL.
	 * @param {Function} onStateChangeCallback - Called when state changes
	 * @returns {Promise<void>}
	 */
	async init(onStateChangeCallback) {
		this.onStateChange = onStateChangeCallback;
		await this.readURL();
	}

	/**
	 * Get the mode and path from a pathname.
	 * @param {string} rawPathname - The pathname to parse.
	 * @returns {Object} the parsed `{ mode, path }`.
	 * @private
	 */
	#parsePathname(rawPathname) {
		const pathName = sanitizePath(rawPathname);

		let mode = 'game';
		let path = '';

		if (pathName !== '' && pathName !== 'index.html') {
			const segments = pathName.split('/');

			if (segments[0] === 'blog' || segments[0] === 'projects') {
				mode = 'text';
				path = pathName;
			} else if (segments[0] === 'game' || segments[0] === 'text') {
				mode = segments[0];
				path = sanitizePath(segments.slice(1).join('/'));
			} else {
				mode = 'game';
				path = pathName;
			}
		}

		return { mode, path };
	}

	/**
	 * Builds a standardized URL pathname for the given mode and clean path.
	 * @param {string} mode - The active mode (`game` or `text`).
	 * @param {string} cleanPath - The sanitized content path.
	 * @returns {string} the formatted URL path.
	 * @private
	 */
	#buildUrl(mode, cleanPath) {
		if (cleanPath.startsWith('blog') || cleanPath.startsWith('projects')) {
			return `/${cleanPath}`;
		}
		if (mode === 'game' && !cleanPath) {
			return '/';
		}
		return `/${mode}${cleanPath ? '/' + cleanPath : ''}`;
	}

	/**
	 * Handles scrolling to an anchor element or resetting scroll positions for the active mode.
	 * @param {string} mode - The active mode (`game` or `text`).
	 * @param {string} [hash=''] - Optional anchor hash fragment.
	 * @private
	 */
	#handleScrollAndFocus(mode, hash = '') {
		if (hash) {
			let id = hash.substring(1);
			try {
				id = decodeURIComponent(id);
			} catch {
				// Malformed URI
			}
			const targetEl = document.getElementById(id);
			if (targetEl) {
				const prefersReducedMotion =
					window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
				targetEl.scrollIntoView({
					behavior: prefersReducedMotion ? 'auto' : 'smooth',
					block: 'start',
				});
			}
		} else {
			if (mode === 'text') {
				const textLayer = document.getElementById('text-layer');
				if (textLayer) {
					textLayer.scrollTop = 0;
				}
			} else {
				const modalContent = document.getElementById('game-modal-content');
				if (modalContent && modalContent.parentElement) {
					modalContent.parentElement.scrollTop = 0;
				}
			}
		}
	}

	/**
	 * Reads the current URL path and applies the state.
	 * @returns {Promise<void>}
	 */
	async readURL() {
		const parsed = this.#parsePathname(window.location.pathname);
		await this.applyState(parsed, true);
	}

	/**
	 * Navigates to a specific mode and path.  
	 * Pushes a new history entry and updates the URL.
	 * @param {string} mode - `game` or `text`
	 * @param {string} path - Content path (e.g., `about/bio`).
	 * @param {string} [hash=''] - Optional anchor hash fragment (e.g., `#anchor`).
	 * @returns {Promise<void>}
	 */
	async go(mode, path, hash = '') {
		const cleanPath = sanitizePath(path);

		let targetMode = mode;

		if (cleanPath.startsWith('blog') || cleanPath.startsWith('projects')) {
			targetMode = 'text';
		}

		const validMode = ['game', 'text'].includes(targetMode) ? targetMode : 'game';
		const newState = { mode: validMode, path: cleanPath };
		const newUrl = this.#buildUrl(validMode, cleanPath);

		if (newState.mode === this.state.mode && newState.path === this.state.path) {
			const currentHash = window.location.hash || '';
			if (currentHash !== hash) {
				window.history.pushState(newState, '', newUrl + hash);
			}

			this.#handleScrollAndFocus(newState.mode, hash);
			return;
		}

		window.history.pushState(newState, '', newUrl + hash);
		await this.applyState(newState);
	}

	/**
	 * Applies state to the application and triggers callback.
	 * @param {Object} state - State object with mode and path.
	 * @param {boolean} updateApp - Whether to trigger the onStateChange callback..
	 * @returns {Promise<void>}
	 */
	async applyState(state, updateApp = true) {
		this.state = state;

		if (updateApp && this.onStateChange) {
			await this.onStateChange(this.state);
		}
	}
}

export const Router = new RouterController();
