/**
 * Navigation  
 * Manages generic focus traversal and scrolling for DOM containers via Gamepad/Keyboard.
 */
class NavigationController {
	constructor() {
		/** @type {HTMLElement|null} The container currently handling focus navigation. */
		this.activeContainer = null;

		/** @type {Object} Configuration for the current context. */
		this.options = {
			scroll: false, // Can this container be scrolled with the stick?
			axis: 'y', // 'x' for horizontal, 'y' for vertical, null for none
		};

		/** @type {number} Last time a navigation input was handled (for debouncing). */
		this.lastMoveTime = 0;
		/** @type {Function|null} Local reference to the focusin listener for cleanup. */
		this._onFocusIn = null;
		/** @type {Array} Stack to store previous navigation contexts for submenus. */
		this.contextStack = [];
	}

	/**
	 * The speed at which the navigation scrolls, measured in pixels per animation frame.
	 * @constant {number}
	 */
	static get SCROLL_SPEED() {
		return 15;
	}
	/**
	 * Debounce interval for navigation-related event handlers, in milliseconds.
	 * @constant {number}
	 */
	static get NAV_DEBOUNCE() {
		return 200;
	}
	/**
	 * The minimum scroll delta (as a fraction of the viewport) required to trigger navigation actions.  
	 * Used to prevent navigation from responding to very small or accidental scroll movements.
	 * @constant {number} A value between 0 and 1 representing the scroll deadzone threshold.
	 */
	static get SCROLL_DEADZONE() {
		return 0.1;
	}
	/**
	 * The minimum threshold value for navigation input to be considered valid.  
	 * Inputs with an absolute value less than this deadzone are ignored to prevent accidental or minor movements.
	 * @constant {number}
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

		const axis = inputState.axis;
		const now = performance.now();
		const debounceActive = now - this.lastMoveTime < NavigationController.NAV_DEBOUNCE;

		// Handle Scrolling
		if (this.options.scroll && Math.abs(axis.y) > NavigationController.SCROLL_DEADZONE) {
			if (
				this.activeContainer.parentElement
				&& this.activeContainer.parentElement.classList.contains('modal-box')
			) {
				this.activeContainer.parentElement.scrollTop -=
					axis.y * NavigationController.SCROLL_SPEED;
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
	 * @param {HTMLElement} containerElement
	 * @param {Object} options
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
	 * @param {HTMLElement} container
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
