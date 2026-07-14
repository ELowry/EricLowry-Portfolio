import { LayeredInput } from './layeredInputs.js';
import { VirtualCursor } from './virtualCursor.js';

/**
 * Navigation
 * Manages generic focus traversal and scrolling for DOM containers via Gamepad/Keyboard.
 */
class NavigationController {
	/**
	 * @property {HTMLElement|null} activeContainer - The container currently handling focus navigation.
	 * @property {Object} options - Configuration for the current context.
	 * @property {number} options.scroll - Whether the Y-axis scrolls the container.
	 * @property {string|null} options.axis - Navigation axis ('x', 'y', or 'null').
	 * @property {boolean} options.roving - Whether to use roving tabindex.
	 * @property {boolean} options.autoFocus - Whether to auto-focus the first element.
	 * @property {number} lastMoveTime - Last time a navigation input was handled (for debouncing).
	 * @property {Function|null} _onFocusIn - Local reference to the focusin listener for cleanup.
	 * @property {Array<Object>} contextStack - Stack to store previous navigation contexts for submenus.
	 */
	constructor() {
		this.activeContainer = null;
		this.options = {
			scroll: false,
			axis: 'y',
		};
		this.lastMoveTime = 0;
		this._onFocusIn = null;
		this.contextStack = [];
	}

	/**
	 * @returns {number} the speed at which the navigation scrolls, measured in pixels per animation frame.
	 * @constant
	 */
	static get SCROLL_SPEED() {
		return 15;
	}

	/**
	 * @returns {number} the speed multiplier for the analog triggers, measured in pixels per animation frame.
	 * @constant
	 */
	static get FAST_SCROLL_MULTIPLIER() {
		return 4;
	}
	/**
	 * @returns {number} the debounce interval for navigation-related event handlers, in milliseconds.
	 * @constant
	 */
	static get NAV_DEBOUNCE() {
		return 200;
	}
	/**
	 * The minimum scroll delta (as a fraction of the viewport) required to trigger navigation actions.
	 * Used to prevent navigation from responding to very small or accidental scroll movements.
	 * @returns {number} a value between 0 and 1 representing the scroll deadzone threshold.
	 * @constant
	 */
	static get SCROLL_DEADZONE() {
		return 0.1;
	}
	/**
	 * Inputs with an absolute value less than this deadzone are ignored to prevent accidental or minor movements.
	 * @returns {number} the minimum threshold value for navigation input to be considered valid.
	 * @constant
	 */
	static get NAVIGATE_DEADZONE() {
		return 0.5;
	}

	/**
	 * Updates the navigation state based on the provided input.
	 * @param {Object} inputState - The current state of user input (from `input.js`).
	 */
	update(inputState) {
		if (!this.activeContainer) {
			return;
		}

		// Ensure we are in a UI-capable layer.
		if (LayeredInput.isActive(LayeredInput.LAYER_GAME)) {
			return;
		}

		const axis = inputState.axis;
		const now = performance.now();
		const debounceActive = now - this.lastMoveTime < NavigationController.NAV_DEBOUNCE;

		if (!this._lastUpdateTime) {
			this._lastUpdateTime = now;
		}
		const dt = Math.max(1, now - this._lastUpdateTime);
		this._lastUpdateTime = now;
		const frameRateMultiplier = dt / (1000 / 60);

		// Handle Scrolling
		let manualScrollY = 0;

		if (inputState.lastInputType === 'gamepad') {
			// Standard Stick Scrolling
			if (Math.abs(axis.y) > NavigationController.SCROLL_DEADZONE) {
				manualScrollY = -axis.y;
			}

			if (inputState.triggerLeft > 0.05) {
				manualScrollY =
					-inputState.triggerLeft * NavigationController.FAST_SCROLL_MULTIPLIER;
			} else if (inputState.triggerRight > 0.05) {
				manualScrollY =
					inputState.triggerRight * NavigationController.FAST_SCROLL_MULTIPLIER;
			}
		}

		if (this.options.scroll && manualScrollY !== 0) {
			let scrollTarget = this.activeContainer;
			if (
				this.activeContainer.classList.contains('modal-box')
				|| this.activeContainer.classList.contains('gallery-modal-content')
				|| this.activeContainer.id === 'text-layer'
			) {
				scrollTarget = this.activeContainer;
			} else if (this.activeContainer.parentElement?.classList.contains('modal-box')) {
				scrollTarget = this.activeContainer.parentElement;
			} else {
				const childBox = this.activeContainer.querySelector(
					'.modal-box, .gallery-modal-content'
				);
				if (childBox) {
					scrollTarget = childBox;
				}
			}

			if (scrollTarget) {
				scrollTarget.scrollBy({
					top: manualScrollY * NavigationController.SCROLL_SPEED * frameRateMultiplier,
					behavior: 'instant',
				});
			}
		}

		// Handle Focus Navigation
		if (this.options.axis && !debounceActive) {
			let navInput = 0;

			if (this.options.axis === 'x') {
				navInput = axis.x;
			} else if (this.options.axis === 'y') {
				navInput = -axis.y;
			}

			if (Math.abs(navInput) > NavigationController.NAVIGATE_DEADZONE) {
				this.lastMoveTime = now;
				this.#moveFocus(navInput);
			}
		}

		// Handle Interaction
		const current = document.activeElement;
		if (
			inputState.interact
			&& inputState.lastInputType === 'gamepad'
			&& current
			&& this.activeContainer.contains(current)
			&& !VirtualCursor.isActive
		) {
			current.classList.add('active');
			setTimeout(() => current.classList.remove('active'), 100);
			current.click();
		}
	}

	/**
	 * Sets the active container context for navigation.
	 * @param {HTMLElement|null} containerElement - The DOM element to set as the active navigation container.
	 * @param {Object} [options] - Navigation behavior settings.
	 * @param {boolean} [options.scroll=false] - Whether the Y-axis scrolls the container.
	 * @param {string|null} [options.axis='y'] - Navigation axis (`x`, `y`, or `null`).
	 * @param {boolean} [options.roving=false] - Whether to use roving tabindex.
	 */
	setContext(containerElement, options = {}) {
		if (this.activeContainer) {
			if (this._onFocusIn) {
				this.activeContainer.removeEventListener('focusin', this._onFocusIn);
			}
			if (this.options.roving) {
				this.#resetRovingTabindex(this.activeContainer);
			}
		}

		this.activeContainer = containerElement;

		this.options = {
			scroll: false,
			axis: 'y',
			roving: false,
			autoFocus: true,
			...options,
		};

		if (!this.activeContainer) {
			return;
		}

		if (this.options.roving) {
			const focusables = this.#getFocusables();
			focusables.forEach((el, i) => {
				el.tabIndex = i === 0 ? 0 : -1;
			});

			this._onFocusIn = (e) => {
				const focusables = this.#getFocusables();
				if (focusables.includes(e.target)) {
					focusables.forEach((el) => {
						el.tabIndex = el === e.target ? 0 : -1;
					});
				}
			};
			this.activeContainer.addEventListener('focusin', this._onFocusIn);
		}

		if (this.options.axis && this.options.autoFocus) {
			setTimeout(() => {
				const first = this.#getFocusables()[0];
				first?.focus({ focusVisible: true });
			}, 10);
		}
	}

	/**
	 * Pushes a new navigation context onto the stack.
	 * Useful for opening submenus (trapping focus).
	 * @param {HTMLElement} containerElement - The container to push onto the navigation stack.
	 * @param {Object} options - Navigation behavior settings for the new context.
	 */
	pushContext(containerElement, options = {}) {
		if (this.activeContainer) {
			this.contextStack.push({
				container: this.activeContainer,
				options: { ...this.options },
			});
		}
		this.setContext(containerElement, options);
	}

	/**
	 * Restores the previous navigation context.
	 * Useful for closing submenus.
	 */
	popContext() {
		if (this.contextStack.length === 0) {
			return;
		}
		const prev = this.contextStack.pop();
		this.setContext(prev.container, prev.options);
	}

	/**
	 * Internal helper to find focusable elements.
	 * @param {HTMLElement|null} container - The container to search within.
	 * @returns {Array<HTMLElement>} An array of focusable elements.
	 * @private
	 */
	#getFocusables(container = this.activeContainer) {
		if (!container) {
			return [];
		}

		const selector = this.options.roving
			? 'button, a[href], input, select, textarea, [tabindex]'
			: 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

		return Array.from(container.querySelectorAll(selector)).filter((el) => {
			const isVisible = el.offsetParent !== null;
			const isNotAriaHidden = !el.getAttribute('aria-hidden');
			const isNotDisabled = !el.hasAttribute('disabled');

			return isVisible && isNotAriaHidden && isNotDisabled;
		});
	}

	/**
	 * Resets tabindex for all elements in a container to the default roving state.
	 * (First item 0, all others -1).
	 * @param {HTMLElement} container - The container whose elements will be reset.
	 * @private
	 */
	#resetRovingTabindex(container) {
		const focusables = this.#getFocusables(container);
		focusables.forEach((el, i) => {
			el.tabIndex = i === 0 ? 0 : -1;
		});
	}

	/**
	 * Internal helper to calculate and set the next focus.
	 * @private
	 * @param {number} direction - Positive (`next`) or Negative (`prev`).
	 */
	#moveFocus(direction) {
		const focusables = this.#getFocusables();
		if (focusables.length === 0) {
			return;
		}

		const currentFocused = document.activeElement;
		let currentIndex = focusables.indexOf(currentFocused);

		if (currentIndex === -1) {
			// If focus was lost, reset to top
			const nextItem = focusables[0];
			if (this.options.roving) {
				focusables.forEach((el) => (el.tabIndex = -1));
				nextItem.tabIndex = 0;
			}
			nextItem.focus({ focusVisible: true });
			nextItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		} else {
			let nextIndex;
			if (direction > 0) {
				nextIndex = (currentIndex + 1) % focusables.length;
			} else {
				nextIndex = (currentIndex - 1 + focusables.length) % focusables.length;
			}

			const nextItem = focusables[nextIndex];

			if (this.options.roving) {
				currentFocused.tabIndex = -1;
				nextItem.tabIndex = 0;
			}

			nextItem.focus({ focusVisible: true });
			nextItem.scrollIntoView({
				block: 'nearest',
				inline: 'nearest',
			});
		}
	}
}

export const Navigation = new NavigationController();
