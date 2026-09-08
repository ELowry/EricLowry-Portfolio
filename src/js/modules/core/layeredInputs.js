import { Events } from './events.js';

/**
 * Manages input priority layers using a stack-based system to prevent input bleed-through.
 * Only the layer at the top of the highest active priority stack can receive inputs.
 */
class LayeredInputController {
	/**
	 * Map of all priority levels and layers.
	 * @type {Map<string, Object>}
	 */
	#layers;

	/**
	 * Active layer IDs for each priority level.
	 * @type {Array<Array<string>>}
	 */
	#priorityStacks;

	/**
	 * The currently active layer.
	 * @type {Object|null}
	 */
	#currentActiveLayer;

	/**
	 * Dev-only console flag.
	 * @type {boolean}
	 */
	#debug;

	/**
	 * (milliseconds) Safeguard against same-frame trigger bleed-through.
	 * @returns {number} the minimum time before a layer starts processing inputs.
	 * @constant
	 */
	static get FRAME_SECURITY_MS() {
		return 16;
	}

	get #CONFIG() {
		return {
			[this.PRIORITY_BACKGROUND]: [],
			[this.PRIORITY_GAME]: [this.LAYER_GAME, this.LAYER_TEXT],
			[this.PRIORITY_UI]: [this.LAYER_GAME_MENU],
			[this.PRIORITY_MODAL]: [this.LAYER_GAME_MODAL, this.LAYER_DIALOG, this.LAYER_GALLERY],
			[this.PRIORITY_SYSTEM]: [this.LAYER_TOUCH_INSTRUCTIONS, this.LAYER_LOADING],
		};
	}

	constructor() {
		this.#layers = new Map();
		this.#priorityStacks = [];
		this.#currentActiveLayer = null;

		this.#debug = import.meta.env.DEV;

		if (this.#debug) {
			console.log('[LayeredInput] Initializing controller...');
		}

		// Initialize empty stacks for each numeric priority level
		for (let i = 0; i <= this.PRIORITY_SYSTEM; i++) {
			this.#priorityStacks.push([]);
		}

		// Auto-register layers.
		for (const [priorityLevelStr, layers] of Object.entries(this.#CONFIG)) {
			const priorityLevel = parseInt(priorityLevelStr, 10);
			if (isNaN(priorityLevel)) {
				continue;
			}
			for (const layerId of layers) {
				this.register(layerId, priorityLevel);
			}
		}
	}

	// PRIORITIES

	/**
	 * @returns {number} should essentuially never receive inputs.
	 * @constant
	 */
	get PRIORITY_BACKGROUND() {
		return 0;
	}
	/**
	 * @returns {number} interactive game mode elements.
	 * @constant
	 */
	get PRIORITY_GAME() {
		return 1;
	}
	/**
	 * @returns {number} UI elements and menus.
	 * @constant
	 */
	get PRIORITY_UI() {
		return 2;
	}
	/**
	 * @returns {number} modal dialogs and popups.
	 * @constant
	 */
	get PRIORITY_MODAL() {
		return 3;
	}
	/**
	 * @returns {number} system-critical events, overlays, and alerts.
	 * @constant
	 */
	get PRIORITY_SYSTEM() {
		return 4;
	}

	// LAYER IDs

	/**
	 * @returns {string} main game layer.
	 * @constant
	 */
	get LAYER_GAME() {
		return 'game';
	}
	/**
	 * @returns {string} text layer.
	 * @constant
	 */
	get LAYER_TEXT() {
		return 'text';
	}
	/**
	 * @returns {string} pause menu layer.
	 * @constant
	 */
	get LAYER_GAME_MENU() {
		return 'gameMenu';
	}
	/**
	 * @returns {string} in-game modal layer.
	 * @constant
	 */
	get LAYER_GAME_MODAL() {
		return 'gameModal';
	}
	/**
	 * @returns {string} dialog system layer.
	 * @constant
	 */
	get LAYER_DIALOG() {
		return 'dialog';
	}
	/**
	 * @returns {string} gallery layer.
	 * @constant
	 */
	get LAYER_GALLERY() {
		return 'gallery';
	}
	/**
	 * @returns {string} touch instructions layer.
	 * @constant
	 */
	get LAYER_TOUCH_INSTRUCTIONS() {
		return 'touchInstructions';
	}
	/**
	 * @returns {string} loading screen layer.
	 * @constant
	 */
	get LAYER_LOADING() {
		return 'loading';
	}

	/**
	 * @returns {string} the layer activation event name.
	 * @constant
	 */
	get LAYER_ACTIVATION_EVENT() {
		return 'layer:activated';
	}

	/**
	 * @returns {string} the layer deactivation event name.
	 * @constant
	 */
	get LAYER_DEACTIVATION_EVENT() {
		return 'layer:deactivated';
	}

	/**
	 * Gets the urrently active layer's ID.
	 * @returns {string|null} the ID of the active layer, or null if no layers are active.
	 */
	get activeLayerId() {
		if (this.#currentActiveLayer) {
			return this.#currentActiveLayer.id;
		}
		return null;
	}

	/**
	 * Re-evaluates the priority stacks from top to bottom to cache the current active layer.
	 * @private
	 */
	#updateActiveCache() {
		const oldId = this.activeLayerId;

		for (let i = this.#priorityStacks.length - 1; i >= 0; i--) {
			const stack = this.#priorityStacks[i];

			if (stack.length === 0) {
				continue;
			}

			const topLayerId = stack[stack.length - 1];
			this.#currentActiveLayer = this.#layers.get(topLayerId);

			if (this.#debug && oldId !== this.activeLayerId) {
				console.log(
					`LayeredInputController: Changed - ${oldId || 'none'} -> ${this.activeLayerId}`
				);
			}
			return;
		}

		this.#currentActiveLayer = null;

		if (this.#debug && oldId !== null) {
			console.log(`LayeredInputController: Changed -${oldId} -> none`);
		}
	}

	/**
	 * Registers a new layer into the system. Must be called before a layer can be activated.
	 * @param {string} id - The layer's unique ID.
	 * @param {number} priority - The layer's priority level.
	 */
	register(id, priority) {
		if (this.#layers.has(id)) {
			return;
		}
		this.#layers.set(id, {
			id: id,
			priority: priority,
			activationTime: 0,
		});
	}

	/**
	 * Activates a layer, pushing it to the top of its assigned priority stack.
	 * @param {string} id - The unique identifier of the layer to activate.
	 */
	activate(id) {
		const layer = this.#layers.get(id);
		if (!layer) {
			return;
		}

		const stack = this.#priorityStacks[layer.priority];
		const existingIndex = stack.indexOf(id);

		if (existingIndex > -1) {
			stack.splice(existingIndex, 1);
		}

		layer.activationTime = performance.now();
		stack.push(id);

		if (this.#debug) {
			console.log(`LayeredInputController: Activated - ${id}`);
		}

		this.#updateActiveCache();

		// Broadcast the activation
		Events.emit(this.LAYER_ACTIVATION_EVENT, id);
		Events.emit(`${this.LAYER_ACTIVATION_EVENT}:${id}`);
	}

	/**
	 * Deactivates a layer, removing it from its assigned priority stack.
	 * @param {string} id - The layer to deactivate's unique ID.
	 */
	deactivate(id) {
		const layer = this.#layers.get(id);
		if (!layer) {
			return;
		}

		const stack = this.#priorityStacks[layer.priority];
		const existingIndex = stack.indexOf(id);

		if (existingIndex > -1) {
			stack.splice(existingIndex, 1);

			if (this.#debug) {
				console.log(`LayeredInputController: Deactivated - ${id}`);
			}

			this.#updateActiveCache();

			// Broadcast the deactivation
			Events.emit(this.LAYER_DEACTIVATION_EVENT, id);
			Events.emit(`${this.LAYER_DEACTIVATION_EVENT}:${id}`);
		}
	}

	/**
	 * Checks if a specific layer is currently the singular active layer capable of receiving inputs.
	 * @param {string} id - The layer to check's unique ID.
	 * @param {boolean} [unsafe=false] - Whether to bypasses the same-frame activation security check.
	 * @returns {boolean} whether the layer is active and allowed to process inputs.
	 */
	isActive(id, unsafe = false) {
		if (!this.#currentActiveLayer || this.#currentActiveLayer.id !== id) {
			return false;
		}

		if (unsafe) {
			return true;
		}

		return (
			performance.now() - this.#currentActiveLayer.activationTime
			> LayeredInputController.FRAME_SECURITY_MS
		);
	}

	/**
	 * Clears all active layers across all priority stacks.
	 */
	clearAll() {
		for (let i = 0; i < this.#priorityStacks.length; i++) {
			this.#priorityStacks[i] = [];
		}
		this.#currentActiveLayer = null;
	}
}

export const LayeredInput = new LayeredInputController();
