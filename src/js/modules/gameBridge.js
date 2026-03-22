/**
 * GameBridge - Small interface for registering game-to-app callbacks.  
 * Call `GameBridge.init({ teleportPlayer, getPlayerPos, requestBehindInteract, requestFrontInteract })` to provide app-side implementations which the game can call into.
 */
export const GameBridge = {
	implementation: null,
	/**
	 * Register implementations for the bridge.
	 * @param {Object} implementations - Object with optional methods: `teleportPlayer`, `playerPos`, `requestBehindInteract`, `requestFrontInteract`
	 */
	init(implementations = {}) {
		this.implementation = implementations;
	},

	/**
	 * Teleports the player using the registered implementation.
	 * @param {{x:number,y:number}} pos - Target position
	 */
	teleportPlayer(pos) {
		if (this.implementation && typeof this.implementation.teleportPlayer === 'function') {
			return this.implementation.teleportPlayer(pos);
		}
		if (App.isLocal) {
			console.warn('GameBridge.teleportPlayer called but no implementation set.');
		}
	},

	/**
	 * @returns {{x:number,y:number}|null} the current player position from the registered implementation or `null`.
	 */
	get playerPos() {
		if (this.implementation && typeof this.implementation.getPlayerPos === 'function') {
			return this.implementation.getPlayerPos();
		}
		return null;
	},

	/**
	 * Requests the app to perform the behind-interact animation/sequence.
	 * @param {number} duration - Suggested duration in ms for the animation.
	 * @returns {Promise<void>} a Promise that resolves when the request completes (e.g., after fade/teleport).
	 */
	requestBehindInteract(duration = 500) {
		if (
			this.implementation
			&& typeof this.implementation.requestBehindInteract === 'function'
		) {
			return this.implementation.requestBehindInteract(duration);
		}
		return Promise.resolve();
	},

	/**
	 * Requests the app to perform the front-interact animation/sequence.
	 * @param {number} duration - Suggested duration in ms for the animation.
	 * @returns {Promise<void>} a Promise that resolves when the request completes (e.g., after fade/teleport).
	 */
	requestFrontInteract(duration = 800) {
		if (this.implementation && typeof this.implementation.requestFrontInteract === 'function') {
			return this.implementation.requestFrontInteract(duration);
		}
		return Promise.resolve();
	},
};
