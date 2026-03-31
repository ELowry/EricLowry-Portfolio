import { Events } from './events.js';
import { LayeredInput } from './layeredInputs.js';

/**
 * TutorialManager - Manages touch tutorial detection and presentation.
 * Shows/hides the touch instructions overlay
 *
 * @param {AppController} app - Reference to the App instance.
 */
export class TutorialManager {
	constructor(app) {
		/** @type {AppController} Main application instance. */
		this.app = app;
		/** @type {boolean} Persistent flag indicating if the user has seen the instructions. */
		this.hasSeenTouchTutorial = localStorage.getItem('hideTouchTutorial') === 'true';
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

		// Check for tutorial visibility whenever the game layer becomes active
		Events.on(LayeredInput.LAYER_ACTIVATION_EVENT, (layerId) => {
			if (layerId === LayeredInput.LAYER_GAME) {
				this.tryShowTouchTutorial();
			}
		});
	}

	/**
	 * Attempts to show the touch tutorial if appropriate conditions are met.
	 */
	tryShowTouchTutorial() {
		if (this.hasSeenTouchTutorial || this.app.Input.lastInputType !== 'touch') {
			return;
		}

		// Only show the tutorial if the game layer is the singular active layer.
		if (LayeredInput.isActive(LayeredInput.LAYER_GAME)) {
			this.openTouchInstructions();
		}
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
