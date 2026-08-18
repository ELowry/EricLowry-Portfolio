import { Engine } from '../core/engineContext.js';
import { Events } from '../core/events.js';
import { Input } from './input.js';
import { LayeredInput } from '../core/layeredInputs.js';

/**
 * Manages a screen-space pointer moved via controller.
 * Used primarily for navigating UI elements when standard directional focus is impractical.
 */
class VirtualCursorController {
	/**
	 * @property {HTMLElement|null} element - The cursor element.
	 * @property {boolean} isActive - Whether the cursor is currently active and visible.
	 * @property {boolean} isLayerActive - Whether a viable parent layer is currently active.
	 * @property {HTMLElement|null} currentHover - The element currently under the virtual cursor.
	 * @property {number} hoverStartTime - The time at which the current element was hovered.
	 * @property {boolean} isScrolling - Whether the cursor is actively triggering edge-scrolling.
	 * @property {Array<HTMLElement>} magnetismTargets - Cache of interactive elements for magnetism.
	 * @property {HTMLElement|null} lastContainer - Cache of the last container element.
	 */
	constructor() {
		this.element = null;
		this.isActive = false;
		this.isLayerActive = false;
		this.currentHover = null;
		this.hoverStartTime = 0;
		this.isScrolling = false;
		this.magnetismTargets = [];
		this.lastContainer = null;
	}

	/**
	 * @returns {number} the base movement speed of the cursor.
	 * @constant
	 */
	static get BASE_SPEED() {
		return 15;
	}

	/**
	 * @returns {number} the deadzone for the right stick to prevent drifting.
	 * @constant
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
		const activeLayers = [
			LayeredInput.LAYER_GAME_MODAL,
			LayeredInput.LAYER_GALLERY,
			LayeredInput.LAYER_TEXT,
		];

		Events.on(LayeredInput.LAYER_ACTIVATION_EVENT, (layerId) => {
			if (activeLayers.includes(layerId)) {
				this.isLayerActive = true;
			}
		});

		Events.on(LayeredInput.LAYER_DEACTIVATION_EVENT, (layerId) => {
			if (activeLayers.includes(layerId)) {
				// Fallback check in case active layers are stacked
				this.isLayerActive = activeLayers.some((layer) =>
					LayeredInput.isActive(layer, true)
				);
			}
		});

		let resizeTimeout;
		window.addEventListener('resize', () => {
			if (!this.isActive) {
				return;
			}
			if (resizeTimeout) {
				cancelAnimationFrame(resizeTimeout);
			}
			resizeTimeout = requestAnimationFrame(() => {
				this.#clampToParent();
				this.#updateVisuals();
			});
		});
	}

	/**
	 * Updates cursor position and interaction state each frame.
	 */
	update() {
		if (!this.element) {
			return;
		}

		// Only active for specific layers and when using a controller.
		const shouldBeActive = this.isLayerActive && Input.lastInputType === 'gamepad';

		let activeParent;
		if (LayeredInput.isActive(LayeredInput.LAYER_TEXT, true)) {
			activeParent = document.getElementById('text-layer');
		} else {
			activeParent = Array.from(document.querySelectorAll('dialog[open]')).pop();
		}

		const now = performance.now();
		if (!this._lastUpdateTime) {
			this._lastUpdateTime = now;
		}
		const dt = Math.max(1, now - this._lastUpdateTime);
		this._lastUpdateTime = now;
		this.frameRateMultiplier = dt / (1000 / 60);

		if (shouldBeActive && activeParent) {
			if (!this.isActive || this.element.parentElement !== activeParent) {
				this.isActive = true;
				activeParent.appendChild(this.element);
				this.element.classList.add('active');
				this.#centerCursorInParent();
			}
		} else if (this.isActive) {
			this.isActive = false;
			this.lastContainer = null;
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
		const speed = VirtualCursorController.BASE_SPEED * this.frameRateMultiplier;

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
			this.#clampToParent();
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
		const container = this.#getContainer();
		if (!container) {
			return;
		}

		const rect = container.getBoundingClientRect();
		const scaleFactor = Math.max(0.6, Math.min(1.4, window.innerHeight / 1080));
		const scrollThreshold = 60 * scaleFactor;

		// Disable magnetism if the cursor is trying to scroll the page
		if (
			Input.cursorPos.y < rect.top + scrollThreshold
			|| Input.cursorPos.y > rect.bottom - scrollThreshold
			|| Input.cursorPos.x < rect.left + scrollThreshold
			|| Input.cursorPos.x > rect.right - scrollThreshold
		) {
			return;
		}

		// Y negative is Up
		const stickDir = Engine.LJS.vec2(stick.x, -stick.y);

		const maxRange = 100;
		const pullStrength = 0.15 * this.frameRateMultiplier;
		const exitThreshold = 0.2; // Speed required to break magnetism

		let bestTarget = null;
		let bestScore = -Infinity;

		const clampPull = (x, y) => {
			const maxPull = 12 * this.frameRateMultiplier;
			const len = Math.sqrt(x * x + y * y);
			if (len > maxPull) {
				return { x: (x / len) * maxPull, y: (y / len) * maxPull };
			}
			return { x, y };
		};

		this.#updateMagnetismCache(container);
		for (const target of this.magnetismTargets) {
			const targetRect = target.getBoundingClientRect();
			const center = Engine.LJS.vec2(
				targetRect.left + targetRect.width / 2,
				targetRect.top + targetRect.height / 2
			);
			const toCenter = center.subtract(Engine.LJS.vec2(Input.cursorPos.x, Input.cursorPos.y));
			const dist = toCenter.length();

			if (dist > maxRange) {
				continue;
			}

			if (target === this.currentHover) {
				// Gentle center pull when moving slowly inside element
				if (stick.length() < exitThreshold) {
					const pull = clampPull(
						toCenter.x * pullStrength * 0.4,
						toCenter.y * pullStrength * 0.4
					);
					Input.cursorPos.x += pull.x;
					Input.cursorPos.y += pull.y;
				}
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
			const pull = clampPull(toTarget.x * force, toTarget.y * force);
			Input.cursorPos.x += pull.x;
			Input.cursorPos.y += pull.y;
		}
	}

	/**
	 * Updates the cache of interactive elements for magnetism.
	 * @param {HTMLElement} container - The container element to search for interactive elements.
	 * @private
	 */
	#updateMagnetismCache(container) {
		if (this.lastContainer !== container) {
			this.magnetismTargets = Array.from(
				container.querySelectorAll(
					'button, a, [role="button"], [tabindex]:not([tabindex="-1"]), .md-gallery-item'
				)
			);
			this.lastContainer = container;
		}
	}

	/**
	 * Scrolls the parent content if the cursor is near the edges.
	 * @private
	 */
	#handleAutoScroll() {
		const container = this.#getContainer();
		if (!container) {
			return;
		}

		const rect = container.getBoundingClientRect();

		// Scroll feel slightly adjusted based on resolution
		const scaleFactor = Math.max(0.6, Math.min(1.4, window.innerHeight / 1080));
		const scrollThreshold = 60 * scaleFactor;
		const maxScrollSpeed = 12 * scaleFactor * this.frameRateMultiplier;

		let scrollY = 0;
		let scrollX = 0;

		// Scroll speed based on proximity to edge
		if (Input.cursorPos.y < rect.top + scrollThreshold) {
			const intensity = 1 - (Input.cursorPos.y - rect.top) / scrollThreshold;
			scrollY = -intensity * maxScrollSpeed;
		} else if (Input.cursorPos.y > rect.bottom - scrollThreshold) {
			const intensity = 1 - (rect.bottom - Input.cursorPos.y) / scrollThreshold;
			scrollY = intensity * maxScrollSpeed;
		}

		if (Input.cursorPos.x < rect.left + scrollThreshold) {
			const intensity = 1 - (Input.cursorPos.x - rect.left) / scrollThreshold;
			scrollX = -intensity * maxScrollSpeed;
		} else if (Input.cursorPos.x > rect.right - scrollThreshold) {
			const intensity = 1 - (rect.right - Input.cursorPos.x) / scrollThreshold;
			scrollX = intensity * maxScrollSpeed;
		}

		if (scrollY !== 0 || scrollX !== 0) {
			this.isScrolling = true;
			container.scrollBy({
				top: scrollY,
				left: scrollX,
				behavior: 'instant',
			});
		} else {
			this.isScrolling = false;
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
				this.currentHover.focus({
					focusVisible: true,
					preventScroll: this.isScrolling,
				});
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

			// Visual feedback duration
			setTimeout(() => {
				this.element?.classList.remove('clicking');
			}, 150);

			if (this.currentHover) {
				this.currentHover.click();
			} else {
				document.body.click();
			}
		}
	}

	/**
	 * @returns {HTMLElement|null} the active container element.
	 * @private
	 */
	#getContainer() {
		if (LayeredInput.isActive(LayeredInput.LAYER_TEXT, true)) {
			return document.getElementById('text-layer');
		}
		return document.querySelector(
			'dialog[open] .modal-box, dialog[open] .gallery-modal-content'
		);
	}

	/**
	 * Restricts the cursor position to the boundaries of the current parent.
	 * @private
	 */
	#clampToParent() {
		const container = this.#getContainer();
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
	 * Centers the cursor within the current parent.
	 * @private
	 */
	#centerCursorInParent() {
		const container = this.#getContainer();
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
