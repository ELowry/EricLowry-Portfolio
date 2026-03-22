import { App } from '../app.js';
import { Input } from './input.js';
import { Content } from './content.js';
import { Events } from './events.js';
import { GameBridge } from './gameBridge.js';

/**
 * InteractionController manages interactive objects in the game world.  
 * Handles detection, highlighting, and triggering of object interactions.
 */
class InteractionController {
	constructor() {
		/** @type {Object[]} Array of interactive objects in the map. */
		this.activeObjects = [];
		/** @type {Object|null} The object currently under the player's interaction distance. */
		this.highlightedObject = null;
		/** @type {number} Detection radius for interactions. */
		this.interactionRadius = 2.2;
		/** @type {number|null} Handle for the UI label fade-out timer. */
		this.overlayTimeout = null;
		/** @type {number} Timestamp until which input is ignored (cooldown). */
		this.blockTimer = 0;
	}

	/**
	 * The duration in milliseconds to block user input after an interaction.
	 * @constant {number}
	 */
	static get BLOCK_INPUT_MS() {
		return 500;
	}

	/**
	 * Finds the closest interactive object within range.
	 * @param {vec2} playerPos - Current player position
	 * @returns {Object|null} The closest object or null
	 * @private
	 */
	#findClosestObject(playerPos) {
		let closest = null;
		let minDist = this.interactionRadius;

		for (const obj of this.activeObjects) {
			const dist = playerPos.distance(obj.pos);
			if (dist > obj.radius) {
				continue;
			}

			if (dist >= minDist) {
				continue;
			}

			minDist = dist;
			closest = obj;
		}
		return closest;
	}

	/**
	 * Triggers interaction for the given object.  
	 * Handles navigation or custom actions.
	 * @param {Object} obj - The interactive object
	 * @private
	 */
	#triggerInteraction(obj) {
		if (obj.type === 'category') {
			// Special handling for the 'exit' node: ensure player enters the parent map at the coordinate matching where the child map expects the entry to be.
			if (obj.id === 'parent_exit' || obj.path === '') {
				const parentPath = obj.path || '';
				const parentNode = Content.findNodeByPath(parentPath);
				const childId = App.currentMapId;
				const posData = parentNode?.mapData?.positions?.[childId];
				if (posData && typeof posData.x === 'number') {
					App.pendingEntryX = posData.x;
				} else if (obj.pos && typeof obj.pos.x === 'number') {
					App.pendingEntryX = obj.pos.x;
				}
			}

			if (!obj.below) {
				GameBridge.requestBehindInteract(500).then(async () => {
					App.uiManager.showLoading(true, true);
					await new Promise((r) => setTimeout(r, 500));
					App.navigate(obj.path);
				});
			} else {
				GameBridge.requestFrontInteract(800).then(async () => {
					App.uiManager.showLoading(true, true);
					await new Promise((r) => setTimeout(r, 800));
					App.navigate(obj.path);
				});
			}
		} else if (obj.path) {
			App.navigate(obj.path);
		} else if (obj.file) {
			App.loadContentInModal(obj.file);
		} else if (obj.action) {
			obj.action();
		}
	}

	/**
	 * Sets the list of interactive objects for the current map.
	 * @param {Array} objects - Array of interactive objects with `pos`, `file`, `label`, etc.
	 */
	setObjects(objects) {
		this.activeObjects = objects || [];
		this.highlightedObject = null;
	}

	/**
	 * Prevent interactions for a duration.  
	 * Useful when closing menus to prevent 'double interactions'.
	 */
	setBlock() {
		this.blockTimer = performance.now() + InteractionController.BLOCK_INPUT_MS;
	}

	/**
	 * Updates interaction state each frame.  
	 * Finds the closest object in range and handles input.
	 * @param {vec2} playerPos - Current player position
	 */
	update(playerPos) {
		if (performance.now() < this.blockTimer) {
			return;
		}

		if (App.mode === 'text' || !App.isInteractable) {
			this.highlightedObject = null;
			return;
		}

		this.highlightedObject = this.#findClosestObject(playerPos);
		if (this.highlightedObject && Input.interact) {
			Input.spawnTapRipple();
			this.#triggerInteraction(this.highlightedObject);
		}
	}

	/**
	 * Renders highlights and labels for interactive objects.
	 */
	render() {
		for (const obj of this.activeObjects) {
			const isHighlighted = obj === this.highlightedObject;
			const color = isHighlighted
				? new App.LJS.Color(1, 1, 0, 0.8)
				: new App.LJS.Color(1, 1, 1, 0.7);

			App.LJS.drawRect(obj.pos, App.LJS.vec2(1, 1), color);

			// If this object is highlighted and has a label, emit an event so the UI can show it
			if (isHighlighted && obj.label) {
				Events.emit('interaction:label', obj.label);
			}
		}

		// If nothing is highlighted, ensure the UI overlay hides
		if (!this.highlightedObject) {
			Events.emit('interaction:label', null);
		}
	}
}

export const Interaction = new InteractionController();
