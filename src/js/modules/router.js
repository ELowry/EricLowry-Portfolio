/**
 * RouterController handles application state via URL paths and the History API.
 * Manages clean path-based routing (e.g., `/game/about` instead of `?mode=game&path=about`).
 */
class RouterController {
	/** @type {Object} The internal application state { mode, path }. */
	state = {
		mode: 'game',
		path: '',
	};
	/** @type {Function|null} Callback triggered when the URL or state changes. */
	onStateChange = null;

	/**
	 * Constructor for `RouterController`
	 */
	constructor() {
		window.addEventListener('popstate', (e) => {
			if (e.state) {
				if (e.state.mode === this.state.mode && e.state.path === this.state.path) {
					return;
				}
				this.applyState(e.state);
			} else {
				const parsed = this.#parsePathname(window.location.pathname);
				if (parsed.mode === this.state.mode && parsed.path === this.state.path) {
					return;
				}
				this.applyState(parsed);
			}
		});

		window.addEventListener('hashchange', () => {
			const hash = window.location.hash;
			if (hash) {
				let id = hash.substring(1);
				try {
					id = decodeURIComponent(id);
				} catch (err) {
					// Fallback if decode fails
				}
				const targetEl = document.getElementById(id);
				if (targetEl) {
					targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}
		});
	}

	/**
	 * Gets the current content path.
	 * @returns {string} the current path
	 */
	get currentPath() {
		return this.state.path;
	}

	/**
	 * Gets the current mode.
	 * @returns {string} the current mode (`game` or `text`)
	 */
	get currentMode() {
		return this.state.mode;
	}

	/**
	 * Determines if the current path belongs to the dynamic blog system.
	 * @returns {boolean} true if the path starts with `blog`.
	 */
	get isBlogRoute() {
		return this.state.path.startsWith('blog');
	}

	/**
	 * Determines if the current path belongs to the dynamic project system.
	 * @returns {boolean} true if the path starts with `projects`.
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
	 * Parses a window pathname into mode and path.
	 * @param {string} rawPathname - The pathname to parse.
	 * @returns {Object} the parsed state containing `{ mode, path }`.
	 * @private
	 */
	#parsePathname(rawPathname) {
		const pathName = this.sanitizePath(rawPathname);

		let mode = 'game';
		let path = '';

		if (pathName !== '' && pathName !== 'index.html') {
			const segments = pathName.split('/');

			if (segments[0] === 'blog' || segments[0] === 'projects') {
				mode = 'text';
				path = pathName;
			} else if (segments[0] === 'game' || segments[0] === 'text') {
				mode = segments[0];
				path = this.sanitizePath(segments.slice(1).join('/'));
			} else {
				mode = 'game';
				path = pathName;
			}
		}

		// TEMP TEXT-ONLY START
		if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
			mode = 'text';
		}
		// TEMP TEXT-ONLY END

		return { mode, path };
	}

	/**
	 * Sanitizes a URL path.
	 * @param {string} path - Raw path to sanitize
	 * @returns {string} a clean path
	 */
	sanitizePath(path) {
		if (!path) {
			return '';
		}

		let cleanPath = path
			.replace(/\/+/g, '/')
			.replace(/^\/|\/$/g, '')
			.trim();

		if (cleanPath.endsWith('/index.html')) {
			cleanPath = cleanPath.slice(0, -11);
		} else if (cleanPath === 'index.html') {
			cleanPath = '';
		}

		return cleanPath;
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
	 * @param {string} path - Content path (e.g., `about/bio`)
	 * @param {string} [hash=''] - Optional anchor hash fragment (e.g., `#my-anchor`)
	 * @returns {Promise<void>}
	 */
	async go(mode, path, hash = '') {
		const cleanPath = this.sanitizePath(path);

		let targetMode = mode;

		if (cleanPath.startsWith('blog') || cleanPath.startsWith('projects')) {
			targetMode = 'text';
		}

		// TEMP TEXT-ONLY START
		if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
			// TEMP TEXT-ONLY END
			targetMode = 'text';
			// TEMP TEXT-ONLY START
		}
		// TEMP TEXT-ONLY END

		const validMode = ['game', 'text'].includes(targetMode) ? targetMode : 'game';
		const newState = { mode: validMode, path: cleanPath };

		let newUrl;
		if (cleanPath.startsWith('blog') || cleanPath.startsWith('projects')) {
			newUrl = `/${cleanPath}`;
		} else if (validMode === 'game' && !cleanPath) {
			newUrl = '/';
		} else {
			newUrl = `/${validMode}${cleanPath ? '/' + cleanPath : ''}`;
		}

		if (newState.mode === this.state.mode && newState.path === this.state.path) {
			const currentHash = window.location.hash || '';
			if (currentHash !== hash) {
				window.history.pushState(newState, '', newUrl + hash);
			}

			if (hash) {
				let id = hash.substring(1);
				try {
					id = decodeURIComponent(id);
				} catch (e) {
					// Malformed URI
				}
				const targetEl = document.getElementById(id);
				if (targetEl) {
					targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			} else {
				if (newState.mode === 'text') {
					const textLayer = document.getElementById('text-layer');
					if (textLayer) textLayer.scrollTop = 0;
				} else {
					const modalContent = document.getElementById('game-modal-content');
					if (modalContent) modalContent.scrollTop = 0;
				}
			}
			return;
		}

		window.history.pushState(newState, '', newUrl + hash);
		await this.applyState(newState);
	}

	/**
	 * Applies state to the application and triggers callback.
	 * @param {Object} state - State object with mode and path
	 * @param {boolean} updateApp - Whether to trigger the onStateChange callback
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
