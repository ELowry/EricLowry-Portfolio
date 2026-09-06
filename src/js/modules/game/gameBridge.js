/**
 * GameBridge - Small interface for registering game-to-app callbacks.
 * Call `GameBridge.init({ teleportPlayer, getPlayerPos, requestBehindInteract, requestFrontInteract })` to provide app-side implementations which the game can call into.
 * @param {Object} implementations - Object with optional methods: `teleportPlayer`, `playerPos`, `requestBehindInteract`, `requestFrontInteract`
 * @param {function(Object):void} implementations.teleportPlayer - Teleports the player
 * @param {function():{x:number,y:number}|null} implementations.getPlayerPos - Gets the player position
 * @param {function(number):Promise<void>} implementations.requestBehindInteract - Requests the behind-interact animation
 * @param {function(number):Promise<void>} implementations.requestFrontInteract - Requests the front-interact animation
 */
export const GameBridge = {
	implementation: null,
	mapBounds: null,

	/**
	 * Register implementations for the bridge.
	 * @param {Object} implementations - Object with optional methods: `teleportPlayer`, `playerPos`, `requestBehindInteract`, `requestFrontInteract`
	 */
	init(implementations = {}) {
		this.implementation = implementations;
	},

	/**
	 * Sets the horizontal boundaries for the current map.
	 * @param {{minX: number, maxX: number}|null} bounds - The boundary limits, or null for an infinite map.
	 */
	setMapBounds(bounds) {
		this.mapBounds = bounds || null;
	},

	/**
	 * Teleports the player using the registered implementation.
	 * @param {{x:number,y:number}} pos - Target position
	 * @returns {void} nothing
	 */
	teleportPlayer(pos) {
		if (this.implementation && typeof this.implementation.teleportPlayer === 'function') {
			return this.implementation.teleportPlayer(pos);
		}
		if (import.meta.env.DEV) {
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
	 * Updates the player's texture index.
	 * @param {number} index - The spritesheet index.
	 * @returns {void} nothing
	 */
	setPlayerTexture(index) {
		if (this.implementation && typeof this.implementation.setPlayerTexture === 'function') {
			this.implementation.setPlayerTexture(index);
		}
	},

	/**
			 * Requests an animation of the player interacting with something "behind" them.
			 * @param {number} duration - The animation duration in ms.
			 * @returns {Promise<void>} a Promise that resolves when the request completes.
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
			 * Requests an animation of the player interacting with something "in front" of them.
			 * @param {number} duration - The animation duration in ms.
			 * @returns {Promise<void>} a Promise that resolves when the request completes.
			 */
	requestFrontInteract(duration = 800) {
		if (this.implementation && typeof this.implementation.requestFrontInteract === 'function') {
			return this.implementation.requestFrontInteract(duration);
		}
		return Promise.resolve();
	},

	/**
			 * Requests that the intro cinematic be triggered.
			 * @returns {Promise<void>} a Promise that resolves when the sequence completes.
			 */
	playIntroCinematic() {
		if (
			this.implementation
			&& typeof this.implementation.playIntroCinematic === 'function'
		) {
			return this.implementation.playIntroCinematic();
		}
		return Promise.resolve();
	},
};
