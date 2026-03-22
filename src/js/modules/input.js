import { App } from '../app.js';
import { Events } from './events.js';

/**
 * InputController manages physical keyboard, virtual touch, and gamepad inputs.  
 * It translates raw hardware signals into game-specific actions (axis, interact, menu).
 */
class InputController {
	/** @type {HTMLTemplateElement|null} */
	#tapDirectionTemplate = null;
	/** @type {HTMLTemplateElement|null} */
	#tapRippleTemplate = null;
	/** @type {Map<number, number>} Active direction pulse interval handles keyed by pointer ID */
	#directionIntervals = new Map();
	/** @type {{x: number, y: number}|null} Screen position of the last interact touch */
	#lastInteractPos = null;

	constructor() {
		/** @type {Object} State of virtual buttons (mostly for touch) */
		this.virtualState = {
			left: false,
			right: false,
			interact: false,
			menu: false,
		};

		/** @type {Map<number, Object>} Active pointer tracking for multi-touch */
		this.activePointers = new Map();

		/** @type {'mnk'|'touch'|'gamepad'} */
		this.lastInputType = 'mnk';

		/** @type {{x: number, y: number}} Current screen-space position of the virtual cursor */
		this.cursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

		// Detect Mouse & Keyboard usage
		window.addEventListener('keydown', () => this.#setInputType('mnk'));
		window.addEventListener('pointerdown', (e) => {
			if (e.pointerType === 'mouse') {
				this.#setInputType('mnk');
			}
		});
	}

	/**
	 * Base time (ms) a stationary touch must persist to count as a tap.
	 * @constant {number}
	 */
	static get TAP_STATIONARY_MS() {
		return 32;
	}
	/**
	 * Multiplier applied to movement distance to increase required time.
	 * @constant {number}
	 */
	static get MOVEMENT_PENALTY_MULT() {
		return 8;
	}
	/**
	 * Maximum penalty (ms) that movement can add.
	 * @constant {number}
	 */
	static get MAX_MOVEMENT_PENALTY_MS() {
		return 218;
	}
	/**
	 * Maximum movement (px) allowed for a tap to remain valid.
	 * @constant {number}
	 */
	static get TAP_MAX_MOVE_PX() {
		return 30;
	}
	/**
	 * Gamepad deadzone threshold along the X axis.
	 * @constant {number}
	 */
	static get GAMEPAD_DEADZONE_X() {
		return 0.3;
	}
	/**
	 * Gamepad deadzone threshold along the Y axis.
	 * @constant {number}
	 */
	static get GAMEPAD_DEADZONE_Y() {
		return 0.1;
	}
	/**
	 * Gamepad deadzone threshold for the right stick (analog cursor).
	 * @constant {number}
	 */
	static get GAMEPAD_DEADZONE_STICK_RIGHT() {
		return 0.02;
	}

	/**
	 * @returns {boolean} `true` if the interact action was triggered this frame.
	 */
	get interact() {
		return (
			App.mode === 'game'
			&& (App.LJS.gamepadWasPressed(0) // A
				|| App.LJS.keyWasPressed('KeyE')
				|| App.LJS.keyWasPressed('Space')
				|| App.LJS.keyWasPressed('Enter')
				|| this.virtualState.interact)
		);
	}

	/**
	 * @returns {boolean} `true` if the menu action was triggered this frame.
	 */
	get menu() {
		return (
			App.mode === 'game'
			&& (App.LJS.gamepadWasPressed(9) // Menu
				|| App.LJS.keyWasPressed('Escape'))
		);
	}

	/**
	 * @returns {boolean} `true` if the menu action was triggered this frame.
	 */
	get back() {
		return App.mode === 'game' && App.LJS.gamepadWasPressed(1); // B
	}

	/**
	 * Returns the current horizontal movement axis (`-1`, `0`, or `1`).  
	 * Priorities: Gamepad > Touch > Keyboard.
	 * @returns {vec2} Movement vector
	 */
	get axis() {
		if (App.mode !== 'game') {
			return App.LJS.vec2(0, 0);
		}

		let x = 0;
		let y = 0;

		// Keyboard
		const keyDir = App.LJS.keyDirection();
		if (keyDir.x !== 0) {
			x = keyDir.x;
		}
		if (keyDir.y !== 0) {
			y = keyDir.y;
		}

		// Touch
		if (this.virtualState.left) {
			x = -1;
		}
		if (this.virtualState.right) {
			x = 1;
		}

		// Gamepad
		const stick = App.LJS.gamepadStick(0);
		if (Math.abs(stick.x) > InputController.GAMEPAD_DEADZONE_X) {
			x = Math.sign(stick.x);
		}
		if (Math.abs(stick.y) > InputController.GAMEPAD_DEADZONE_Y) {
			y = stick.y;
		}

		return App.LJS.vec2(x, y);
	}

	/**
	 * Returns the raw input from the secondary (right) gamepad stick.  
	 * @returns {vec2} Right stick axis vector
	 */
	get rightAxis() {
		const stick = App.LJS.gamepadStick(1);
		return App.LJS.vec2(stick.x, stick.y);
	}

	/**
	 * Initializes touch event listeners on a container.  
	 * Uses a 'Swipe Guard' to distinguish between intentional taps and browser gestures.
	 * @param {HTMLElement} container - The element to attach listeners to.
	 */
	initTouch(container) {
		if (!container) {
			return;
		}

		this.#tapDirectionTemplate = document.getElementById('tmpl-touch-half-circle');
		this.#tapRippleTemplate = document.getElementById('tmpl-touch-tap-ripple');

		const handlePointer = (e) => {
			if (e.pointerType !== 'touch') {
				return;
			}

			this.#setInputType('touch');

			switch (e.type) {
				case 'pointerdown': {
					const element = document.elementFromPoint(e.clientX, e.clientY);
					if (element && element.id && element.id.startsWith('touch-')) {
						this.activePointers.set(e.pointerId, {
							zoneId: element.id,
							startX: e.clientX,
							startY: e.clientY,
							lastX: e.clientX,
							lastY: e.clientY,
							startTime: performance.now(),
							dist: 0,
							isActive: false,
							triggered: false,
						});
					}
					break;
				}
				case 'pointermove': {
					const data = this.activePointers.get(e.pointerId);
					if (data) {
						const dx = e.clientX - data.startX;
						const dy = e.clientY - data.startY;
						data.dist = Math.sqrt(dx * dx + dy * dy);
						data.lastX = e.clientX;
						data.lastY = e.clientY;

						const currentElement = document.elementFromPoint(e.clientX, e.clientY);
						if (!currentElement || currentElement.id !== data.zoneId) {
							this.#removeTapDirection(e.pointerId);
							this.activePointers.delete(e.pointerId);
							break;
						}

						// Block browser scrolling once the game action is verified
						if (data.isActive) {
							e.preventDefault();
						}
					}
					break;
				}
				default: {
					this.#removeTapDirection(e.pointerId);
					this.activePointers.delete(e.pointerId);
					break;
				}
			}

			this.#updateVirtualState();
		};

		container.addEventListener('pointerdown', handlePointer);
		container.addEventListener('pointermove', handlePointer);
		container.addEventListener('pointerup', handlePointer);
		container.addEventListener('pointercancel', handlePointer);
		document.addEventListener('pointerdown', (e) => {
			if (e.pointerType === 'touch') {
				this.#setInputType('touch');
			}
		});
	}

	/**
	 * Frame-update for time-based input validation.
	 */
	update() {
		this.#updateVirtualState();

		// Detect Gamepad usage
		if (
			App.LJS.gamepadWasPressed(0) // A
			|| App.LJS.gamepadWasPressed(1) // B
			|| App.LJS.gamepadWasPressed(9) // Menu
			|| App.LJS.gamepadStick(0).length() > InputController.GAMEPAD_DEADZONE_X // Left stick X
			|| App.LJS.gamepadStick(0).length() > InputController.GAMEPAD_DEADZONE_Y // Left stick Y
			|| App.LJS.gamepadStick(1).length() > InputController.GAMEPAD_DEADZONE_STICK_RIGHT // Right stick
		) {
			this.#setInputType('gamepad');
		}
	}

	/**
	 * Helper to update input type and emit change event if needed.
	 * @param {'mnk'|'touch'|'gamepad'} type - The new input type.
	 * @private
	 */
	#setInputType(type) {
		if (this.lastInputType !== type) {
			this.lastInputType = type;
			Events.emit('input:typeChanged', type);
		}
	}

	/**
	 * Calculates the virtual input state based on logged pointers.
	 * @private
	 */
	#updateVirtualState() {
		this.virtualState.left = false;
		this.virtualState.right = false;

		const now = performance.now();
		const pointersToCleanup = [];

		for (const [id, data] of this.activePointers) {
			if (data.isActive) {
				if (data.zoneId === 'touch-left') {
					this.virtualState.left = true;
					this.#updateTapDirection(id, data);
				}
				if (data.zoneId === 'touch-right') {
					this.virtualState.right = true;
					this.#updateTapDirection(id, data);
				}

				if (data.zoneId === 'touch-center' && !data.triggered) {
					this.virtualState.interact = true;
					data.triggered = true;
					this.#lastInteractPos = { x: data.lastX, y: data.lastY };
				}
			} else {
				// Validate touch: stationary taps trigger after `InputController.TAP_STATIONARY_MS`.
				// Movement adds a penalty (up to `InputController.MAX_MOVEMENT_PENALTY_MS`) to discourage accidental swipes.
				const movementPenalty = data.dist * InputController.MOVEMENT_PENALTY_MULT;
				const requiredTime =
					InputController.TAP_STATIONARY_MS
					+ Math.min(InputController.MAX_MOVEMENT_PENALTY_MS, movementPenalty);
				const elapsed = now - data.startTime;

				if (elapsed < requiredTime) {
					continue;
				}

				if (data.dist < InputController.TAP_MAX_MOVE_PX) {
					data.isActive = true;
				} else {
					pointersToCleanup.push(id);
					continue;
				}
			}
		}

		for (const id of pointersToCleanup) {
			this.#removeTapDirection(id);
			this.activePointers.delete(id);
		}
	}

	/**
	 * Starts spawning periodic outward-pulsing ring elements for a continuous touch zone.
	 * @param {number} pointerId - The pointer ID to associate with.
	 * @param {Object} data - The pointer tracking data with lastX, lastY, and zoneId.
	 * @private
	 */
	#updateTapDirection(pointerId, data) {
		if (!this.#tapDirectionTemplate) {
			return;
		}

		if (!this.#directionIntervals.has(pointerId)) {
			this.#spawnDirectionRing(data);
			const intervalId = setInterval(() => {
				const current = this.activePointers.get(pointerId);
				if (current) {
					this.#spawnDirectionRing(current);
				}
			}, 400);
			this.#directionIntervals.set(pointerId, intervalId);
		}
	}

	/**
	 * Spawns a single outward-pulsing half-circle ring at the pointer's current position.
	 * @param {Object} data - The pointer tracking data with lastX, lastY, and zoneId.
	 * @private
	 */
	#spawnDirectionRing(data) {
		const element = this.#tapDirectionTemplate.content.firstElementChild.cloneNode(true);
		if (data.zoneId === 'touch-right') {
			element.classList.add('facing-right');
		}
		element.style.left = `${data.lastX}px`;
		element.style.top = `${data.lastY}px`;
		document.body.appendChild(element);
		element.addEventListener('animationend', () => element.remove(), { once: true });
	}

	/**
	 * Stops the direction pulse interval and cleans up for a given pointer.
	 * @param {number} pointerId - The pointer ID whose feedback should be removed.
	 * @private
	 */
	#removeTapDirection(pointerId) {
		const intervalId = this.#directionIntervals.get(pointerId);
		if (intervalId !== undefined) {
			clearInterval(intervalId);
			this.#directionIntervals.delete(pointerId);
		}
	}

	/**
	 * Spawns a one-shot tap ripple at the last interact touch position.  
	 * Should be called externally when a touch-based interaction actually succeeds.
	 */
	spawnTapRipple() {
		if (!this.#tapRippleTemplate || !this.#lastInteractPos) {
			return;
		}

		const element = this.#tapRippleTemplate.content.firstElementChild.cloneNode(true);
		element.style.left = `${this.#lastInteractPos.x}px`;
		element.style.top = `${this.#lastInteractPos.y}px`;
		document.body.appendChild(element);

		element.addEventListener('animationend', () => element.remove(), { once: true });
		this.#lastInteractPos = null;
	}

	/**
	 * Resets one-shot virtual signals at the end of a frame.
	 */
	clearEvents() {
		this.virtualState.interact = false;
	}
}

export const Input = new InputController();

