import { Engine } from '../core/engineContext.js';
import { Events } from '../core/events.js';
import { Router } from '../core/router.js';

/**
 * InputController manages physical keyboard, virtual touch, and gamepad inputs.
 * It translates raw hardware signals into game-specific actions (axis, interact, menu).
 */
class InputController {
	/** @type {{x: number, y: number}|null} Screen position of the last interact touch */
	#lastInteractPos = null;

	/** @type {Gamepad[]} Cached gamepads for the current frame */
	#gamepads = [];

	/**
	 * @property {Object} virtualState - State of virtual buttons (mostly for touch)
	 * @property {boolean} virtualState.left - Left virtual button state
	 * @property {boolean} virtualState.right - Right virtual button state
	 * @property {boolean} virtualState.interact - Interact virtual button state
	 * @property {boolean} virtualState.menu - Menu virtual button state
	 * @property {Map<number, Object>} activePointers - Active pointer tracking for multi-touch
	 * @property {'mnk'|'touch'|'gamepad'} lastInputType - Last input type used
	 * @property {{x: number, y: number}} cursorPos - Current screen-space position of the virtual cursor
	 */

	/**
	 * Creates an instance of InputController.
	 */
	constructor() {
		this.virtualState = {
			left: false,
			right: false,
			interact: false,
			menu: false,
		};

		this.activePointers = new Map();

		this.lastInputType = 'mnk';

		this.cursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

		// Detect Mouse & Keyboard usage
		const boundMouseInput = this.#handleMouseInput.bind(this);
		window.addEventListener('keydown', () => this.#setInputType('mnk'));
		window.addEventListener('pointermove', boundMouseInput);
		window.addEventListener('pointerdown', boundMouseInput);
	}

	/**
	 * Base time (ms) a stationary touch must persist to count as a tap.
	 * @returns {number} the base time (ms) a stationary touch must persist to count as a tap
	 * @constant
	 */
	static get TAP_STATIONARY_MS() {
		return 32;
	}
	/**
	 * @returns {number} the multiplier applied to movement distance to increase required time
	 * @constant
	 */
	static get MOVEMENT_PENALTY_MULT() {
		return 8;
	}
	/**
	 * @returns {number} the maximum penalty (ms) that movement can add
	 * @constant
	 */
	static get MAX_MOVEMENT_PENALTY_MS() {
		return 218;
	}
	/**
	 * @returns {number} the maximum movement (px) allowed for a tap to remain valid
	 * @constant
	 */
	static get TAP_MAX_MOVE_PX() {
		return 30;
	}
	/**
	 * @returns {number} the gamepad deadzone threshold along the X axis
	 * @constant
	 */
	static get GAMEPAD_DEADZONE_X() {
		return 0.3;
	}
	/**
	 * @returns {number} the gamepad deadzone threshold along the Y axis
	 * @constant
	 */
	static get GAMEPAD_DEADZONE_Y() {
		return 0.1;
	}
	/**
	 * @returns {number} the gamepad deadzone threshold for the right stick (analog cursor)
	 * @constant
	 */
	static get GAMEPAD_DEADZONE_STICK_RIGHT() {
		return 0.02;
	}
	/**
	 * @returns {number} the nterval (ms) between visual pulse animations for directional touch
	 * @constant
	 */
	static get TOUCH_PULSE_INTERVAL_MS() {
		return 400;
	}

	/**
	 * @returns {boolean} `true` if the interact action was triggered this frame.
	 */
	get interact() {
		return (
			Engine.LJS.gamepadWasPressed(0) // A
			|| Engine.LJS.keyWasPressed('KeyE')
			|| Engine.LJS.keyWasPressed('Space')
			|| Engine.LJS.keyWasPressed('Enter')
			|| this.virtualState.interact
		);
	}

	/**
	 * @returns {boolean} `true` if the menu action was triggered this frame.
	 */
	get menu() {
		return (
			Engine.LJS.gamepadWasPressed(9) // Menu
			|| Engine.LJS.keyWasPressed('Escape')
		);
	}

	/**
	 * @returns {boolean} `true` if the menu action was triggered this frame.
	 */
	get back() {
		return Engine.LJS.gamepadWasPressed(1); // B
	}

	/**
	 * Returns the current horizontal movement axis (`-1`, `0`, or `1`).
	 * Priorities: Gamepad > Touch > Keyboard.
	 * @returns {vec2} a movement vector
	 */
	get axis() {
		let x = 0;
		let y = 0;

		// Keyboard
		const keyDir = Engine.LJS.keyDirection();
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
		const stick = Engine.LJS.gamepadStick(0);
		if (Math.abs(stick.x) > InputController.GAMEPAD_DEADZONE_X) {
			x = Math.sign(stick.x);
		}
		if (Math.abs(stick.y) > InputController.GAMEPAD_DEADZONE_Y) {
			y = stick.y;
		}

		return Engine.LJS.vec2(x, y);
	}

	/**
	 * Returns the raw input from the secondary (right) gamepad stick.
	 * @returns {vec2} the right stick axis vector
	 */
	get rightAxis() {
		const stick = Engine.LJS.gamepadStick(1);
		return Engine.LJS.vec2(stick.x, stick.y);
	}

	/**
	 * @returns {boolean} `true` if the left bumper (LB) was pressed this frame.
	 */
	get bumperLeft() {
		return Engine.LJS.gamepadWasPressed(4);
	}

	/**
	 * @returns {boolean} `true` if the right bumper (RB) was pressed this frame.
	 */
	get bumperRight() {
		return Engine.LJS.gamepadWasPressed(5);
	}

	/**
	 * @returns {number} The raw analog value (0.0 to 1.0) of the left trigger (LT).
	 */
	get triggerLeft() {
		const gp = this.#gamepads[0];
		return gp && gp.buttons[6] ? gp.buttons[6].value : 0;
	}

	/**
	 * @returns {number} The raw analog value (0.0 to 1.0) of the right trigger (RT).
	 */
	get triggerRight() {
		const gp = this.#gamepads[0];
		return gp && gp.buttons[7] ? gp.buttons[7].value : 0;
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
							lastPulseTime: 0,
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
				case 'pointerup':
				case 'pointercancel':
				default: {
					const data = this.activePointers.get(e.pointerId);

					// Catch quick taps that end before the 32ms validation delay finishes
					if (
						data
						&& !data.triggered
						&& data.zoneId === 'touch-center'
						&& data.dist < InputController.TAP_MAX_MOVE_PX
					) {
						this.virtualState.interact = true;
						this.#lastInteractPos = { x: data.lastX, y: data.lastY };
					}

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
		if (Router.currentMode === 'game') {
			this.#updateVirtualState();
		}

		if (navigator.getGamepads) {
			this.#gamepads = navigator.getGamepads();
		}

		// Detect Gamepad usage
		if (
			Engine.LJS.gamepadWasPressed(0) // A
			|| Engine.LJS.gamepadWasPressed(1) // B
			|| Engine.LJS.gamepadWasPressed(9) // Menu
			|| Engine.LJS.gamepadStick(0).length() > InputController.GAMEPAD_DEADZONE_X // Left stick X
			|| Engine.LJS.gamepadStick(0).length() > InputController.GAMEPAD_DEADZONE_Y // Left stick Y
			|| Engine.LJS.gamepadStick(1).length() > InputController.GAMEPAD_DEADZONE_STICK_RIGHT // Right stick
		) {
			this.#setInputType('gamepad');
		}
	}

	/**
	 * Detects mouse pointer events to switch input type.
	 * @param {PointerEvent} e - The pointer event.
	 * @private
	 */
	#handleMouseInput(e) {
		if (e.pointerType === 'mouse') {
			this.#setInputType('mnk');
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
			document.body.setAttribute('data-input-type', type);
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
					this.#handleDirectionPulse(data, now);
				}
				if (data.zoneId === 'touch-right') {
					this.virtualState.right = true;
					this.#handleDirectionPulse(data, now);
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

		for (const pointerId of pointersToCleanup) {
			this.activePointers.delete(pointerId);
		}
	}

	/**
	 * Evaluates the time elapsed since the last visual ring pulse and spawns a new one if needed.
	 * @param {Object} data - The pointer tracking data.
	 * @param {number} now - The current performance.now() timestamp.
	 * @private
	 */
	#handleDirectionPulse(data, now) {
		if (now - data.lastPulseTime >= InputController.TOUCH_PULSE_INTERVAL_MS) {
			this.#spawnDirectionRing(data);
			data.lastPulseTime = now;
		}
	}

	/**
	 * Spawns a single outward-pulsing half-circle ring at the pointer's current position.
	 * @param {Object} data - The pointer tracking data with lastX, lastY, and zoneId.
	 * @private
	 */
	#spawnDirectionRing(data) {
		const element = document.createElement('div');
		element.className = 'touch-feedback touch-half-circle';
		element.setAttribute('aria-hidden', 'true');

		if (data.zoneId === 'touch-right') {
			element.classList.add('facing-right');
		}
		element.style.left = `${data.lastX}px`;
		element.style.top = `${data.lastY}px`;
		document.body.appendChild(element);
		element.addEventListener('animationend', () => element.remove(), { once: true });
	}

	/**
	 * Spawns a one-shot tap ripple at the last interact touch position.
	 * Should be called externally when a touch-based interaction actually succeeds.
	 */
	spawnTapRipple() {
		if (!this.#lastInteractPos) {
			return;
		}

		const element = document.createElement('div');
		element.className = 'touch-feedback touch-tap-ripple';
		element.setAttribute('aria-hidden', 'true');

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
