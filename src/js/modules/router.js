/**
 * RouterController handles application state via URL paths and the History API.  
 * Manages clean path-based routing (e.g., `/game/about` instead of `?mode=game&path=about`).
 */
class RouterController {
	constructor() {
		/** @type {Object} The internal application state { mode, path }. */
		this.state = {
			mode: 'game',
			path: '',
		};
		/** @type {Function|null} Callback triggered when the URL or state changes. */
		this.onStateChange = null;

		window.addEventListener('popstate', (e) => {
			if (e.state) {
				this.applyState(e.state);
			} else {
				this.readURL();
			}
		});
	}

	/**
	 * Gets the current content path.
	 * @returns {string} Current path
	 */
	get currentPath() {
		return this.state.path;
	}

	/**
	 * Gets the current mode.
	 * @returns {string} Current mode (`game` or `text`)
	 */
	get currentMode() {
		return this.state.mode;
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
	 * Sanitizes a URL path by removing edge cases.
	 * @param {string} path - Raw path to sanitize
	 * @returns {string} Clean path
	 */
	sanitizePath(path) {
		if (!path) {
			return '';
		}

		return path
			.replace(/\/+/g, '/') // Replace multiple slashes with single slash
			.replace(/^\/|\/$/g, '') // Remove leading and trailing slashes
			.toLowerCase() // Normalize case
			.trim();
	}

	/**
	 * Reads the current URL path and applies the state.  
	 * Handles formats like: `/game/about/bio` or `/text/projects`
	 * @returns {Promise<void>}
	 */
	async readURL() {
		const pathName = this.sanitizePath(window.location.pathname);

		let mode = 'game';
		let path = '';

		if (pathName !== '' && pathName !== 'index.html') {
			const segments = pathName.split('/');

			if (segments[0] === 'game' || segments[0] === 'text') {
				mode = segments[0];
				path = this.sanitizePath(segments.slice(1).join('/'));
			} else {
				mode = 'game';
				path = pathName;
			}
		}

		await this.applyState({ mode, path }, true);
	}

	/**
	 * Navigates to a specific mode and path.  
	 * Pushes a new history entry and updates the URL.
	 * @param {string} mode - `game` or `text`
	 * @param {string} path - Content path (e.g., `about/bio`)
	 * @returns {Promise<void>}
	 */
	async go(mode, path) {
		const validMode = ['game', 'text'].includes(mode) ? mode : 'game';
		const cleanPath = this.sanitizePath(path);
		const newState = { mode: validMode, path: cleanPath };

		if (newState.mode === this.state.mode && newState.path === this.state.path) {
			return;
		}

		let newUrl = '/';
		if (validMode === 'game' && !cleanPath) {
			newUrl = '/';
		} else {
			newUrl = `/${validMode}${cleanPath ? '/' + cleanPath : ''}`;
		}

		window.history.pushState(newState, '', newUrl);
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
