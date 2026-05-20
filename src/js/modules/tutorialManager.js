import { Events } from './events.js';
import { LayeredInput } from './layeredInputs.js';

/**
 * TutorialManager - Manages touch tutorial detection and presentation.
 * Shows/hides the touch instructions overlay
 *
 * @param {AppController} app - Reference to the App instance.
 */
export class TutorialManager {
	/**
	 * @param {AppController} app - Main application instance.
	 * @param {boolean} hasSeenTouchTutorial - Persistent flag indicating if the user has seen the instructions.
	 */
	constructor(app, hasSeenTouchTutorial) {
		this.app = app;
		this.hasSeenTouchTutorial = hasSeenTouchTutorial;
	}

	/**
	 * Initialize touch-detection listeners required by the tutorial manager.
	 */
	init() {
		Events.on('input:typeChanged', (type) => {
			if (type === 'touch') {
				this.tryShowTouchTutorial();
			}
		});

		// Check for tutorial visibility on layer change events
		Events.on(LayeredInput.LAYER_ACTIVATION_EVENT, (layerId) => {
			if (layerId === LayeredInput.LAYER_GAME) {
				this.tryShowTouchTutorial();
			}
		});
		Events.on(LayeredInput.LAYER_DEACTIVATION_EVENT, () => {
			this.tryShowTouchTutorial();
		});
	}

	/**
	 * Consumes input for the tutorial layer.
	 * @param {Object} inputState - The current state from the Input module.
	 * @returns {boolean} `true` if the input was consumed by the tutorial manager.
	 */
	handleInput(inputState) {
		if (!LayeredInput.isActive(LayeredInput.LAYER_TOUCH_INSTRUCTIONS)) {
			return false;
		}

		if (inputState.back || inputState.menu) {
			this.closeTouchInstructions();
		}

		return true;
	}

	/**
	 * Attempts to show the touch tutorial if appropriate conditions are met.
	 */
	tryShowTouchTutorial() {
		if (this.hasSeenTouchTutorial || this.app.Input.lastInputType !== 'touch') {
			return;
		}

		// Defer execution to allow state changes (like mode switching) to settle
		Promise.resolve().then(() => {
			if (this.hasSeenTouchTutorial || this.app.Input.lastInputType !== 'touch') {
				return;
			}

			// Only show the tutorial if the game layer is the singular active layer
			if (this.app.mode === 'game' && LayeredInput.isActive(LayeredInput.LAYER_GAME, true)) {
				this.openTouchInstructions();
			}
		});
	}

	/**
	 * Show the touch instructions overlay and pause the game.
	 */
	openTouchInstructions() {
		this.hasSeenTouchTutorial = true;

		LayeredInput.activate(LayeredInput.LAYER_TOUCH_INSTRUCTIONS);
		this.app.setPause(true);

		document.body.classList.add('show-touch-zones');
		this.app.uiManager.elements.touchInstructions.classList.remove('hidden');
		this.app.uiManager.elements.touchInstructions.setAttribute('aria-hidden', 'false');

		const closeBtn = this.app.uiManager.elements.touchInstructions.querySelector('button');
		closeBtn?.focus({ focusVisible: true });
	}

	/**
	 * Close the touch instructions overlay and persist preference if requested.
	 */
	closeTouchInstructions() {
		if (this.app.uiManager.elements.touchDontShow.checked) {
			this.hasSeenTouchTutorial = true;
			localStorage.setItem('hideTouchTutorial', 'true');
		}

		LayeredInput.deactivate(LayeredInput.LAYER_TOUCH_INSTRUCTIONS);

		this.app.uiManager.elements.touchInstructions.classList.add('hidden');
		this.app.uiManager.elements.touchInstructions.setAttribute('aria-hidden', 'true');
		document.body.classList.remove('show-touch-zones');
		this.app.onModalClose();
	}
}
