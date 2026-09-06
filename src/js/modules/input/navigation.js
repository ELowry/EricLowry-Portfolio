import { LayeredInput } from '../core/layeredInputs.js';
import { VirtualCursor } from './virtualCursor.js';

/**
 * Navigation
 * Manages generic focus traversal and scrolling for DOM containers via Gamepad/Keyboard.
 */
export class NavigationController {
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
		this.lastMoveTime = -Infinity;
		this._onFocusIn = null;
		this._autoFocusTimeout = null;
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

		const now = performance.now();
		const debounceActive = now - this.lastMoveTime < NavigationController.NAV_DEBOUNCE;

		if (!this._lastUpdateTime) {
			this._lastUpdateTime = now;
		}
		const dt = Math.max(1, now - this._lastUpdateTime);
		this._lastUpdateTime = now;
		const frameRateMultiplier = dt / (1000 / 60);

		// Handle Scrolling (Right Stick & Triggers)
		const { x: manualScrollX, y: manualScrollY } = this.#calculateScroll(inputState);

		if (this.options.scroll && (manualScrollY !== 0 || manualScrollX !== 0)) {
			const scrollTarget = this.#getScrollTarget(manualScrollY, manualScrollX);

			if (scrollTarget) {
				scrollTarget.scrollBy({
					top: manualScrollY * NavigationController.SCROLL_SPEED * frameRateMultiplier,
					left: manualScrollX * NavigationController.SCROLL_SPEED * frameRateMultiplier,
					behavior: 'instant',
				});
			}
		}

		// Handle Focus & Paging Navigation (D-Pad, and Left Stick if Virtual Cursor is inactive)
		if (!debounceActive && inputState.lastInputType === 'gamepad') {
			let navX = inputState.navAxis.x;
			let navY = inputState.navAxis.y;

			if (!VirtualCursor.isActive) {
				if (Math.abs(inputState.cursorAxis.x) > NavigationController.NAVIGATE_DEADZONE) {
					navX = Math.sign(inputState.cursorAxis.x);
				}
				if (Math.abs(inputState.cursorAxis.y) > NavigationController.NAVIGATE_DEADZONE) {
					navY = Math.sign(inputState.cursorAxis.y);
				}
			}

			this.#calculateFocus({ x: navX, y: navY }, debounceActive, inputState);
		}

		// Handle Interaction
		this.#handleInteraction(inputState);
	}

	/**
	 * Internal helper to find the most appropriate scroll target based on the active focus.
	 * Allows nested scrollable areas to capture scroll events before falling back to the parent.
	 * @param {number} manualScrollY - The requested vertical scroll amount.
	 * @param {number} manualScrollX - The requested horizontal scroll amount.
	 * @returns {HTMLElement|null} The DOM element to apply the scroll to.
	 * @private
	 */
	#getScrollTarget(manualScrollY, manualScrollX) {
		const nestedTarget = this.#findNestedScrollTarget(manualScrollY, manualScrollX);
		if (nestedTarget) {
			return nestedTarget;
		}

		// Fallback to the main active container logic
		let scrollTarget = this.activeContainer;
		if (
			this.activeContainer.classList.contains('modal-box')
			|| this.activeContainer.classList.contains('modal-content')
			|| this.activeContainer.classList.contains('gallery-modal-content')
			|| this.activeContainer.id === 'text-layer'
		) {
			scrollTarget = this.activeContainer;
		} else if (
			this.activeContainer.parentElement?.classList.contains('modal-box')
			|| this.activeContainer.parentElement?.classList.contains('modal-content')
		) {
			scrollTarget = this.activeContainer.parentElement;
		} else {
			const childBox = this.activeContainer.querySelector(
				'.modal-box, .modal-content, .gallery-modal-content'
			);
			if (childBox) {
				scrollTarget = childBox;
			}
		}
		return scrollTarget;
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
	 * @param {number} direction - Positive (`next`) or Negative (`prev`).
	 * @param {Object} inputState - The current state of user input.
	 * @private
	 */
	#moveFocus(direction, inputState) {
		const focusables = this.#getFocusables();
		if (focusables.length === 0) {
			return;
		}

		const currentFocused = document.activeElement;
		let currentIndex = focusables.indexOf(currentFocused);
		let nextItem;

		if (currentIndex === -1) {
			// Focus lost, reset to top
			nextItem = focusables[0];
		} else {
			let nextIndex;
			if (direction > 0) {
				nextIndex = (currentIndex + 1) % focusables.length;
			} else {
				nextIndex = (currentIndex - 1 + focusables.length) % focusables.length;
			}

			nextItem = focusables[nextIndex];
		}

		nextItem.focus({ focusVisible: true });
		nextItem.scrollIntoView({
			block: 'nearest',
			inline: 'nearest',
		});

		if (inputState && inputState.lastInputType === 'gamepad') {
			const updateCursor = () => {
				if (document.activeElement === nextItem) {
					const rect = nextItem.getBoundingClientRect();
					inputState.cursorPos.x = rect.left + rect.width / 2;
					inputState.cursorPos.y = rect.top + rect.height / 2;
				}
			};

			// Snap immediately, then track briefly to accommodate smooth scrolling
			requestAnimationFrame(updateCursor);
			setTimeout(updateCursor, 100);
			setTimeout(updateCursor, 250);
		}
	}

	/**
	 * Calculates the manual scroll delta based on input state.
	 * @param {Object} inputState - The current state of user input.
	 * @returns {Object} An object containing the `x` and `y` scroll deltas.
	 * @private
	 */
	#calculateScroll(inputState) {
		let manualScrollY = 0;
		let manualScrollX = 0;

		if (inputState.lastInputType === 'gamepad') {
			const scrollAxis = inputState.scrollAxis || { x: 0, y: 0 };

			if (Math.abs(scrollAxis.y) > NavigationController.SCROLL_DEADZONE) {
				manualScrollY = -scrollAxis.y;
			}

			if (Math.abs(scrollAxis.x) > NavigationController.SCROLL_DEADZONE) {
				manualScrollX = scrollAxis.x;
			}

			if (inputState.triggerLeft > 0.05) {
				manualScrollY =
					-inputState.triggerLeft * NavigationController.FAST_SCROLL_MULTIPLIER;
			} else if (inputState.triggerRight > 0.05) {
				manualScrollY =
					inputState.triggerRight * NavigationController.FAST_SCROLL_MULTIPLIER;
			}
		}

		return { x: manualScrollX, y: manualScrollY };
	}

	/**
	 * Processes focus navigation based on calculated input.
	 * @param {vec2} navAxis - The navigation input value.
	 * @param {boolean} debounceActive - Whether the debounce timer is currently active.
	 * @param {Object} inputState - The current state of user input.
	 * @private
	 */
	#calculateFocus(navAxis, debounceActive, inputState) {
		if (debounceActive || !navAxis || (navAxis.x === 0 && navAxis.y === 0)) {
			return;
		}

		let focusInput = 0;
		let pageInput = 0;

		const primaryAxis = this.options.axis || 'y';

		if (primaryAxis === 'y') {
			focusInput = -navAxis.y;
			pageInput = navAxis.x;
		} else if (primaryAxis === 'x') {
			focusInput = navAxis.x;
			pageInput = -navAxis.y;
		}

		if (Math.abs(focusInput) > NavigationController.NAVIGATE_DEADZONE) {
			this.lastMoveTime = performance.now();
			this.#moveFocus(Math.sign(focusInput), inputState);
		} else if (
			Math.abs(pageInput) > NavigationController.NAVIGATE_DEADZONE
			&& this.options.scroll
		) {
			this.lastMoveTime = performance.now();
			this.#pageScroll(Math.sign(pageInput));
		}
	}

	/**
	 * Performs a page-sized scroll in the specified direction based on the orthogonal input.
	 * @param {number} direction - Positive (down/right) or Negative (up/left).
	 * @private
	 */
	#pageScroll(direction) {
		const manualScrollY = this.options.axis === 'x' ? 0 : direction;
		const manualScrollX = this.options.axis === 'x' ? direction : 0;
		const scrollTarget =
			this.#getScrollTarget(manualScrollY, manualScrollX) || this.activeContainer;

		if (!scrollTarget) {
			return;
		}

		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const behavior = prefersReducedMotion ? 'instant' : 'smooth';

		if (this.options.axis === 'x') {
			const pageAmount = scrollTarget.clientWidth * 0.8 * direction;
			scrollTarget.scrollBy({ left: pageAmount, behavior });
		} else {
			const pageAmount = scrollTarget.clientHeight * 0.8 * direction;
			scrollTarget.scrollBy({ top: pageAmount, behavior });
		}
	}

	/**
	 * Handles interaction input for the active focus element.
	 * @param {Object} inputState - The current state of user input.
	 * @private
	 */
	#handleInteraction(inputState) {
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
	 * Traverses the DOM to find a nested scrollable container that can handle the requested scroll.
	 * @param {number} manualScrollY - The requested vertical scroll amount.
	 * @param {number} manualScrollX - The requested horizontal scroll amount.
	 * @returns {HTMLElement|null} The scrollable container if found, otherwise null.
	 * @private
	 */
	#findNestedScrollTarget(manualScrollY, manualScrollX) {
		let el = document.activeElement;

		while (
			el
			&& el !== document.body
			&& el !== document.documentElement
			&& this.activeContainer?.contains(el)
		) {
			const hasVerticalScroll = el.scrollHeight > el.clientHeight;
			const hasHorizontalScroll = el.scrollWidth > el.clientWidth;
			const style = window.getComputedStyle(el);

			const canScrollY =
				hasVerticalScroll && (style.overflowY === 'auto' || style.overflowY === 'scroll');
			const canScrollX =
				hasHorizontalScroll && (style.overflowX === 'auto' || style.overflowX === 'scroll');

			let isViableTarget = false;

			if (manualScrollY !== 0 && canScrollY) {
				const isAtTop = el.scrollTop <= 0;
				const isAtBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight - 1;

				if ((manualScrollY < 0 && !isAtTop) || (manualScrollY > 0 && !isAtBottom)) {
					isViableTarget = true;
				}
			}

			if (manualScrollX !== 0 && canScrollX) {
				const isAtLeft = el.scrollLeft <= 0;
				const isAtRight = Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth - 1;

				if ((manualScrollX < 0 && !isAtLeft) || (manualScrollX > 0 && !isAtRight)) {
					isViableTarget = true;
				}
			}

			if (isViableTarget) {
				return el;
			}

			el = el.parentElement;
		}

		return null;
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

		if (this._autoFocusTimeout) {
			clearTimeout(this._autoFocusTimeout);
			this._autoFocusTimeout = null;
		}

		if (this.options.axis && this.options.autoFocus) {
			this._autoFocusTimeout = setTimeout(() => {
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
}

export const Navigation = new NavigationController();
