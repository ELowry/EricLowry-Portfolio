import { Lang } from './lang.js';

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
				this.applyState(e.state);
			} else {
				this.readURL();
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
	 * Initializes the router and reads the initial URL.
	 * @param {Function} onStateChangeCallback - Called when state changes
	 * @returns {Promise<void>}
	 */
	async init(onStateChangeCallback) {
		this.onStateChange = onStateChangeCallback;
		await this.readURL();
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

		return path
			.replace(/\/+/g, '/')
			.replace(/^\/|\/$/g, '')
			.toLowerCase()
			.trim();
	}

	/**
	 * Reads the current URL path and applies the state.
	 * @returns {Promise<void>}
	 */
	async readURL() {
		const pathName = this.sanitizePath(window.location.pathname);

		if (pathName === 'rss' || pathName === 'feed') {
			window.location.href = `/feed-${Lang.langCode}.xml`;
			return;
		}

		let mode = 'game';
		let path = '';

		if (pathName !== '' && pathName !== 'index.html') {
			const segments = pathName.split('/');

			if (segments[0] === 'blog') {
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
		const cleanPath = this.sanitizePath(path);

		if (cleanPath === 'rss' || cleanPath === 'feed') {
			window.location.href = '/feed-en_US.xml';
			return;
		}

		let targetMode = mode;

		if (cleanPath.startsWith('blog')) {
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

		if (newState.mode === this.state.mode && newState.path === this.state.path) {
			return;
		}

		let newUrl;
		if (cleanPath.startsWith('blog')) {
			newUrl = `/${cleanPath}`;
		} else if (validMode === 'game' && !cleanPath) {
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
