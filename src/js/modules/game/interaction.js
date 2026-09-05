// File: src/js/modules/game/interaction.js
import { Content } from '../content/content.js';
import { Engine } from '../core/engineContext.js';
import { Events } from '../core/events.js';
import { LayeredInput } from '../core/layeredInputs.js';
import { Router } from '../core/router.js';
import { Input } from '../input/input.js';
import { GameBridge } from './gameBridge.js';

/**
 * InteractionController manages interactive objects in the game world.
 * Handles detection, highlighting, and triggering of object interactions.
 */
class InteractionController {
	/** @type {Object[]} Array of interactive objects in the map. */
	activeObjects;

	/** @type {Object|null} The object currently under the player's interaction distance. */
	highlightedObject;

	/** @type {number} Detection radius for interactions. */
	interactionRadius;

	/** @type {number|null} Handle for the UI label fade-out timer. */
	overlayTimeout;

	/** @type {number} Timestamp until which input is ignored (cooldown). */
	blockTimer;

	/** @type {Object<string, Function>} Map of interaction type handlers. */
	#interactionHandlers;

	/**
	 * Creates an instance of the InteractionController.
	 */
	constructor() {
		this.activeObjects = [];
		this.highlightedObject = null;
		this.interactionRadius = 2.2;
		this.overlayTimeout = null;
		this.blockTimer = 0;

		this.#interactionHandlers = {
			category: (obj) => this.#handleCategoryInteraction(obj),
			content: (obj) => Events.emit('request:navigate', obj.path),
			link: (obj) => Events.emit('request:navigate', obj.path),
			path: (obj) => Events.emit('request:navigate', obj.path),
			file: (obj) => Events.emit('request:modal', obj.file),
			action: (obj) => obj.action(),
		};

		Events.on('route:changed', (payload) => this.#handleMapObjects(payload));
	}

	/**
	 * @returns {number} the duration in milliseconds to block user input after an interaction.
	 * @constant
	 */
	static get BLOCK_INPUT_MS() {
		return 500;
	}

	/**
	 * @returns {number} the duration in milliseconds to wait before transitioning to a new map behind the player.
	 * @constant
	 */
	static get TRANSITION_BEHIND_MS() {
		return 500;
	}

	/**
	 * @returns {number} the duration in milliseconds to wait before transitioning to a new map in front of the player.
	 * @constant
	 */
	static get TRANSITION_FRONT_MS() {
		return 800;
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

		if (!LayeredInput.isActive(LayeredInput.LAYER_GAME)) {
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
	 * Evaluates highlights and labels for interactive objects.
	 */
	render() {
		for (const obj of this.activeObjects) {
			const isHighlighted = obj === this.highlightedObject;

			if (typeof obj.setHighlight === 'function') {
				obj.setHighlight(isHighlighted);
			}

			if (isHighlighted && obj.label) {
				Events.emit('interaction:label', obj.label);
			}
		}

		if (!this.highlightedObject) {
			Events.emit('interaction:label', null);
		}
	}

	/**
	 * Finds the closest interactive object within range.
	 * @param {vec2} playerPos - Current player position
	 * @returns {Object|null} the closest object or null
	 * @private
	 */
	#findClosestObject(playerPos) {
		let closest = null;
		let minDistSq = this.interactionRadius * this.interactionRadius;

		for (const obj of this.activeObjects) {
			const dx = playerPos.x - obj.pos.x;
			const dy = playerPos.y - obj.pos.y;
			const distSq = dx * dx + dy * dy;

			const radiusSq = obj.radius * obj.radius;

			if (distSq > radiusSq || distSq >= minDistSq) {
				continue;
			}

			minDistSq = distSq;
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
		const type =
			obj.type || (obj.path ? 'path' : obj.file ? 'file' : obj.action ? 'action' : null);
		const handler = this.#interactionHandlers[type];
		if (handler) {
			handler(obj);
		}
	}

	/**
	 * Handles building and setting interactive objects based on the current route.
	 * @param {Object} payload - The route:changed event payload.
	 * @param {string} payload.mode - The mode of the new route.
	 * @param {string} payload.path - The path of the new route.
	 * @param {Object} payload.node - The node of the new route.
	 * @private
	 */
	async #handleMapObjects({ mode, path, node }) {
		if (mode !== 'game') {
			return;
		}

		const mapNode = Content.getParentMapNode(path);

		if (mapNode && mapNode.mapData) {
			const pathParts = path.split('/').filter((p) => p);
			const isContent = node && node.type === 'content';
			const mapPath = isContent ? pathParts.slice(0, -1).join('/') : path;

			const currentObjects = Content.buildMapObjects(mapNode, mapPath);

			if (mapNode.id !== 'root') {
				const parentPath = mapPath.split('/').slice(0, -1).join('/');

				currentObjects.push({
					id: 'parent_exit',
					pos: mapNode.mapData.startPos,
					radius: 1.5,
					label: 'Exit Area',
					path: parentPath,
					below: true,
					type: 'category',
				});
			}

			const { Door } = await import('./props/doors.js');

			const mapTexIndex = mapNode.mapData.textureIndex || 0;

			const gameObjects = currentObjects.map((obj) => {
				let variant = 'front';
				if (obj.type === 'content') {
					variant = 'sign';
				} else if (obj.below) {
					variant = 'behind';
				}

				const door = new Door(Engine.LJS.vec2(obj.pos.x, obj.pos.y), variant, {
					textureIndex: mapTexIndex,
				});

				door.id = obj.id;
				door.radius = obj.radius;
				door.file = obj.file;
				door.label = obj.label;
				door.path = obj.path;
				door.below = obj.below;
				door.type = obj.type;

				return door;
			});

			this.setObjects(gameObjects);
		} else {
			this.setObjects([]);
		}
	}

	/**
	 * Handles transition logic for category (map) nodes.
	 * @param {Object} obj - The category interaction object.
	 * @private
	 */
	#handleCategoryInteraction(obj) {
		if (typeof obj.open === 'function') {
			obj.open();
		}

		if (obj.id === 'parent_exit' || obj.path === '') {
			const parentPath = obj.path || '';
			const parentNode = Content.findNodeByPath(parentPath);
			const childId = Content.getParentMapNode(Router.currentPath)?.id;
			const posData = parentNode?.mapData?.positions?.[childId];
			if (posData && typeof posData.x === 'number') {
				Events.emit('request:entryX', posData.x);
			} else if (obj.pos && typeof obj.pos.x === 'number') {
				Events.emit('request:entryX', obj.pos.x);
			}
		}

		if (!obj.below) {
			GameBridge.requestBehindInteract(InteractionController.TRANSITION_BEHIND_MS).then(
				async () => {
					Events.emit('request:loading', { show: true, isModal: true });
					await new Promise((r) => {
						setTimeout(r, InteractionController.TRANSITION_BEHIND_MS);
					});
					Events.emit('request:navigate', obj.path);
				}
			);
		} else {
			GameBridge.requestFrontInteract(InteractionController.TRANSITION_FRONT_MS).then(
				async () => {
					Events.emit('request:loading', { show: true, isModal: true });
					await new Promise((r) => {
						setTimeout(r, InteractionController.TRANSITION_FRONT_MS);
					});
					Events.emit('request:navigate', obj.path);
				}
			);
		}
	}

	/**
	 * Sets the list of interactive objects for the current map.
	 * @param {Array} objects - Array of interactive objects with `pos`, `file`, `label`, etc.
	 */
	setObjects(objects) {
		for (const obj of this.activeObjects) {
			if (typeof obj.destroy === 'function') {
				obj.destroy();
			}
		}

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
}

export const Interaction = new InteractionController();
