import { Events } from './events.js';

/**
 * Manages input priority layers using a stack-based system to prevent input bleed-through.
 * Only the layer at the top of the highest active priority stack can receive inputs.
 */
class LayeredInputController {
	/** @type {Map<string, Object>} Registry of all configured layers and their priority levels. */
	#layers;

	/** @type {Array<Array<string>>} Array of stacks (arrays) representing active layer IDs per priority level. */
	#priorityStacks;

	/** @type {Object|null} Cached reference to the currently active layer. */
	#currentActiveLayer;

	/** @type {boolean} Flag for development-only console output. */
	#debug;

	/**
	 * Constructor for `LayeredInputController`
	 */
	constructor() {
		this.#layers = new Map();
		this.#priorityStacks = [];
		this.#currentActiveLayer = null;

		// Detect local environment for debug logging
		this.#debug = import.meta.env.DEV;

		if (this.#debug) {
			console.log('[LayeredInput] Initializing controller...');
		}

		// Initialize empty stacks for each numeric priority level
		for (let i = 0; i <= this.PRIORITY_SYSTEM; i++) {
			this.#priorityStacks.push([]);
		}

		// Declarative configuration mapping priority groups to their respective layers.
		const config = {
			[this.PRIORITY_BACKGROUND]: [],
			[this.PRIORITY_GAME]: [this.LAYER_GAME, this.LAYER_TEXT],
			[this.PRIORITY_UI]: [this.LAYER_GAME_MENU],
			[this.PRIORITY_MODAL]: [
				this.LAYER_GAME_MODAL,
				this.LAYER_DIALOG,
				this.LAYER_GALLERY,
			],
			[this.PRIORITY_SYSTEM]: [this.LAYER_TOUCH_INSTRUCTIONS, this.LAYER_LOADING],
		};

		// Auto-register layers.
		for (const [priorityLevelStr, layers] of Object.entries(config)) {
			const priorityLevel = parseInt(priorityLevelStr, 10);
			if (isNaN(priorityLevel)) {
				continue;
			}
			for (const layerId of layers) {
				this.register(layerId, priorityLevel);
			}
		}
	}

	/**
	 * Acts as a safeguard against same-frame trigger bleed-through.
	 * @returns {number} the minimum time in milliseconds that must pass before an activated layer can process inputs.
	 * @constant
	 */
	static get FRAME_SECURITY_MS() {
		return 16;
	}

	// PRIORITIES

	/**
	 * @returns {number} the lowest priority level, assigned to layers that should never receive inputs.
	 * @constant
	 */
	get PRIORITY_BACKGROUND() {
		return 0;
	}
	/**
	 * @returns {number} the default priority level for interactive game layers.
	 * @constant
	 */
	get PRIORITY_GAME() {
		return 1;
	}
	/**
	 * @returns {number} the priority level for UI elements such as menus.
	 * @constant
	 */
	get PRIORITY_UI() {
		return 2;
	}
	/**
	 * @returns {number} the priority level for modal dialogs and popups.
	 * @constant
	 */
	get PRIORITY_MODAL() {
		return 3;
	}
	/**
	 * @returns {number} the priority level for system-critical layers.
	 * @constant
	 */
	get PRIORITY_SYSTEM() {
		return 4;
	}

	// LAYER IDs

	/**
	 * @returns {string} the identifier for the main game layer.
	 * @constant
	 */
	get LAYER_GAME() {
		return 'game';
	}
	/**
	 * @returns {string} the identifier for the text layer.
	 * @constant
	 */
	get LAYER_TEXT() {
		return 'text';
	}
	/**
	 * @returns {string} the identifier for the pause menu layer.
	 * @constant
	 */
	get LAYER_GAME_MENU() {
		return 'gameMenu';
	}
	/**
	 * @returns {string} the identifier for the in-game modal layer.
	 * @constant
	 */
	get LAYER_GAME_MODAL() {
		return 'gameModal';
	}
	/**
	 * @returns {string} the identifier for the welcome screen layer.
	 * @constant
	 */
	get LAYER_DIALOG() {
		return 'dialog';
	}
	/**
	 * @returns {string} the identifier for the gallery layer.
	 * @constant
	 */
	get LAYER_GALLERY() {
		return 'gallery';
	}
	/**
	 * @returns {string} the identifier for the touch instructions layer.
	 * @constant
	 */
	get LAYER_TOUCH_INSTRUCTIONS() {
		return 'touchInstructions';
	}
	/**
	 * @returns {string} the identifier for the loading screen layer.
	 * @constant
	 */
	get LAYER_LOADING() {
		return 'loading';
	}

	/**
	 * @returns {string} event name for layer activation.
	 * @constant
	 */
	get LAYER_ACTIVATION_EVENT() {
		return 'layer:activated';
	}

	/**
	 * @returns {string} the event name for layer deactivation.
	 * @constant
	 */
	get LAYER_DEACTIVATION_EVENT() {
		return 'layer:deactivated';
	}

	/**
	 * Gets the ID of the currently active layer.
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
			if (stack.length > 0) {
				const topLayerId = stack[stack.length - 1];
				this.#currentActiveLayer = this.#layers.get(topLayerId);

				if (this.#debug && oldId !== this.activeLayerId) {
					console.log(
						`[LayeredInput] Change: ${oldId || 'none'} -> ${this.activeLayerId}`
					);
				}
				return;
			}
		}

		this.#currentActiveLayer = null;

		if (this.#debug && oldId !== null) {
			console.log(`[LayeredInput] Change: ${oldId} -> none`);
		}
	}

	/**
	 * Registers a new layer into the system. Must be called before a layer can be activated.
	 * @param {string} id - The unique identifier for the layer.
	 * @param {number} priority - The priority level assigned to this layer.
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
			console.log(`[LayeredInput] Activate: ${id}`);
		}

		this.#updateActiveCache();

		// Broadcast the layer activation
		Events.emit(this.LAYER_ACTIVATION_EVENT, id);
		Events.emit(`${this.LAYER_ACTIVATION_EVENT}:${id}`);
	}

	/**
	 * Deactivates a layer, removing it from its assigned priority stack.
	 * @param {string} id - The unique identifier of the layer to deactivate.
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
				console.log(`[LayeredInput] Deactivate: ${id}`);
			}

			this.#updateActiveCache();

			// Broadcast the deactivation
			Events.emit(this.LAYER_DEACTIVATION_EVENT, id);
			Events.emit(`${this.LAYER_DEACTIVATION_EVENT}:${id}`);
		}
	}

	/**
	 * Checks if a specific layer is currently the singular active layer capable of receiving inputs.
	 * @param {string} id - The unique identifier of the layer to check.
	 * @param {boolean} [unsafe=false] - If `true`, bypasses the same-frame activation security check.
	 * @returns {boolean} `true` if the layer is active and allowed to process inputs.
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
