import { App } from '../app.js';
import { Events } from './events.js';
import { Input } from './input.js';
import { LayeredInput } from './layeredInputs.js';

/**
 * Manages a screen-space pointer moved via controller.
 * Used primarily for navigating modals when standard directional focus is impractical.
 */
class VirtualCursorController {
	constructor() {
		/** @type {HTMLElement|null} The cursor element. */
		this.element = null;
		/** @type {boolean} Whether the cursor is currently active and visible. */
		this.isActive = false;
		/** @type {boolean} Whether a modal layer is currently active. */
		this.isModalActive = false;
		/** @type {HTMLElement|null} The element currently under the virtual cursor. */
		this.currentHover = null;
		/** @type {number} The time at which the current element was hovered. */
		this.hoverStartTime = 0;
	}

	/**
	 * Base movement speed of the cursor.
	 * @constant {number}
	 */
	static get BASE_SPEED() {
		return 15;
	}

	/**
	 * Deadzone for the right stick to prevent drifting.
	 * @constant {number}
	 */
	static get STICK_DEADZONE() {
		return 0.15;
	}

	/**
	 * Initializes the cursor by cloning from a template.
	 * @param {HTMLTemplateElement} template - The template element containing the cursor markup.
	 */
	init(template) {
		if (!template) {
			return;
		}
		const clone = template.content.cloneNode(true);
		document.body.appendChild(clone);
		this.element = document.getElementById('virtual-cursor');

		// Subscribe to events instead of polling
		const modalLayers = [
			LayeredInput.LAYER_GAME_MODAL,
			LayeredInput.LAYER_GAME_WELCOME,
			LayeredInput.LAYER_GALLERY,
		];

		Events.on(LayeredInput.LAYER_ACTIVATION_EVENT, (layerId) => {
			if (modalLayers.includes(layerId)) {
				this.isModalActive = true;
			}
		});

		Events.on(LayeredInput.LAYER_DEACTIVATION_EVENT, (layerId) => {
			if (modalLayers.includes(layerId)) {
				// Fallback check in case modals are stacked
				this.isModalActive =
					LayeredInput.isActive(LayeredInput.LAYER_GAME_MODAL, true)
					|| LayeredInput.isActive(LayeredInput.LAYER_GAME_WELCOME, true)
					|| LayeredInput.isActive(LayeredInput.LAYER_GALLERY, true);
			}
		});
	}

	/**
	 * Updates cursor position and interaction state each frame.
	 */
	update() {
		if (!this.element) {
			return;
		}

		// Only active in content modals (isLocked) and when using a controller.
		const shouldBeActive = this.isModalActive && Input.lastInputType === 'gamepad';
		const topModal = Array.from(document.querySelectorAll('dialog[open]')).pop();

		if (shouldBeActive && topModal) {
			if (!this.isActive || this.element.parentElement !== topModal) {
				this.isActive = true;
				topModal.appendChild(this.element);
				this.element.classList.add('active');
				this.#centerCursorInModal();
			}
		} else if (this.isActive) {
			this.isActive = false;
			this.#clearHover();
			this.element.classList.remove('active');
			this.element.remove();
		}

		if (!this.isActive) {
			return;
		}

		this.#handleMovement();
		this.#updateHover();
		this.#handleClick();
	}

	/**
	 * Handles right stick movement and screen clamping.
	 * @private
	 */
	#handleMovement() {
		const stick = Input.rightAxis;
		const speed = VirtualCursorController.BASE_SPEED;

		if (stick.length() > VirtualCursorController.STICK_DEADZONE) {
			// Steeper analog sensitivity curve
			const curveFactor = Math.pow(stick.length(), 3);
			let moveX = stick.x * curveFactor * speed;
			let moveY = -stick.y * curveFactor * speed;

			// Fading resistance/friction when entering an element
			if (this.currentHover) {
				const elapsed = performance.now() - this.hoverStartTime;
				const stictionDuration = 400; // ms before returning to full speed
				const initialResistance = 0.8; // 80% speed reduction

				if (elapsed < stictionDuration) {
					// Ease-out curve for the resistance fade
					const progress = elapsed / stictionDuration;
					const currentResistance = initialResistance * Math.pow(1 - progress, 3);
					const speedMult = 1 - currentResistance;

					moveX *= speedMult;
					moveY *= speedMult;
				}
			}

			Input.cursorPos.x += moveX;
			Input.cursorPos.y += moveY;

			this.#applyMagnetism(stick);
			this.#clampToModal();
			this.#handleAutoScroll();
			this.#updateVisuals();
		}
	}

	/**
	 * Aim assist, pulls the cursor towards nearby interactive elements if moving in their direction.
	 * @param {vec2} stick - Controller stick axis vector.
	 * @private
	 */
	#applyMagnetism(stick) {
		const container = this.#getModalContainer();
		if (!container) {
			return;
		}

		// Y negative is Up
		const stickDir = App.LJS.vec2(stick.x, -stick.y);

		// Find interactive elements within range
		const targets = container.querySelectorAll(
			'button, a, [role="button"], [tabindex]:not([tabindex="-1"]), .md-gallery-item'
		);

		const maxRange = 100;
		const pullStrength = 0.25;
		const exitThreshold = 0.2; // Speed required to break magnetism

		let bestTarget = null;
		let bestScore = -Infinity;

		for (const target of targets) {
			const rect = target.getBoundingClientRect();
			const center = App.LJS.vec2(rect.left + rect.width / 2, rect.top + rect.height / 2);
			const toCenter = center.subtract(App.LJS.vec2(Input.cursorPos.x, Input.cursorPos.y));
			const dist = toCenter.length();

			if (target === this.currentHover) {
				// Pull harder at slows speed
				if (stick.length() < exitThreshold) {
					Input.cursorPos.x += toCenter.x * pullStrength * 2;
					Input.cursorPos.y += toCenter.y * pullStrength * 2;
				}
				continue;
			}

			if (dist > maxRange) {
				continue;
			}

			// Magnetism score
			const dot = toCenter.normalize().dot(stickDir.normalize());

			if (dot > 0.1) {
				const alignment = Math.pow(dot, 2);
				// Moving towards the target
				const score = (1 - dist / maxRange) * alignment;
				if (score > bestScore) {
					bestScore = score;
					bestTarget = { pos: center, dist };
				}
			}
		}

		if (bestTarget && stick.length() < 0.9) {
			// Apply pull
			const force = pullStrength * (1 - bestTarget.dist / maxRange);
			const toTarget = bestTarget.pos.subtract(Input.cursorPos);
			Input.cursorPos.x += toTarget.x * force;
			Input.cursorPos.y += toTarget.y * force;
		}
	}

	/**
	 * Scrolls the modal content if the cursor is near the edges.
	 * @private
	 */
	#handleAutoScroll() {
		const container = this.#getModalContainer();
		if (!container) {
			return;
		}

		const rect = container.getBoundingClientRect();

		// Scroll feel slightly adjusted based on resolution
		const scaleFactor = Math.max(0.6, Math.min(1.4, window.innerHeight / 1080));
		const scrollThreshold = 60 * scaleFactor;
		const maxScrollSpeed = 12 * scaleFactor;

		// Scroll speed based on proximity to edge
		if (Input.cursorPos.y < rect.top + scrollThreshold) {
			const intensity = 1 - (Input.cursorPos.y - rect.top) / scrollThreshold;
			container.scrollTop -= intensity * maxScrollSpeed;
		} else if (Input.cursorPos.y > rect.bottom - scrollThreshold) {
			const intensity = 1 - (rect.bottom - Input.cursorPos.y) / scrollThreshold;
			container.scrollTop += intensity * maxScrollSpeed;
		}
	}

	/**
	 * Finds and focuses the element under the cursor.
	 * @private
	 */
	#updateHover() {
		const el = document.elementFromPoint(Input.cursorPos.x, Input.cursorPos.y);

		// Target links, buttons, role=button, or tabindex
		const target = el?.closest(
			'button, a, [role="button"], [tabindex]:not([tabindex="-1"]), .md-gallery-item'
		);

		if (target !== this.currentHover) {
			this.#clearHover();
			this.currentHover = target;

			if (this.currentHover) {
				this.hoverStartTime = performance.now();
				// Trigger focus state.
				this.currentHover.focus({ focusVisible: true });
			}
		}
	}

	/**
	 * Simulates a click on the hovered element when the interact button is pressed.
	 * @private
	 */
	#handleClick() {
		if (Input.interact) {
			this.element.classList.add('clicking');

			if (this.currentHover) {
				this.currentHover.click();
			}

			// Visual feedback duration
			setTimeout(() => {
				this.element?.classList.remove('clicking');
			}, 150);
		}
	}

	#getModalContainer() {
		return document.querySelector(
			'dialog[open] .modal-box, dialog[open] .gallery-modal-content'
		);
	}

	/**
	 * Restricts the cursor position to the boundaries of the current modal.
	 * @private
	 */
	#clampToModal() {
		const container = this.#getModalContainer();
		if (!container) {
			return;
		}

		const rect = container.getBoundingClientRect();
		const padding = 5;

		Input.cursorPos.x = Math.max(
			rect.left + padding,
			Math.min(rect.right - padding, Input.cursorPos.x)
		);
		Input.cursorPos.y = Math.max(
			rect.top + padding,
			Math.min(rect.bottom - padding, Input.cursorPos.y)
		);
	}

	/**
	 * Centers the cursor within the current modal.
	 * @private
	 */
	#centerCursorInModal() {
		const container = this.#getModalContainer();
		if (!container) {
			return;
		}

		const rect = container.getBoundingClientRect();
		Input.cursorPos.x = rect.left + rect.width / 2;
		Input.cursorPos.y = rect.top + rect.height / 2;
		this.#updateVisuals();
	}

	/**
	 * Updates the cursor element's position.
	 * @private
	 */
	#updateVisuals() {
		if (this.element) {
			this.element.style.transform = `translate(${Input.cursorPos.x}px, ${Input.cursorPos.y}px)`;
		}
	}

	/**
	 * Removes hover highlights and clears current target.
	 * @private
	 */
	#clearHover() {
		if (this.currentHover) {
			this.currentHover.blur();
			this.currentHover = null;
		}
	}
}

export const VirtualCursor = new VirtualCursorController();
