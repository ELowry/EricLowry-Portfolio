import { Events } from './events.js';

/**
 * TutorialManager - Manages touch tutorial detection and presentation.
 *
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
	}

	/**
	 * Attempts to show the touch tutorial if appropriate conditions are met.
	 */
	tryShowTouchTutorial() {
		if (this.hasSeenTouchTutorial || this.app.Input.lastInputType !== 'touch') {
			return;
		}

		const isWelcoming = this.app.uiManager.elements.gameWelcome?.open;
		const isLoading = !this.app.uiManager.elements.loadingOverlay?.classList.contains('hidden');
		const instructionsVisible = !this.app.uiManager.elements.touchInstructions?.classList.contains('hidden');
		const isModalOpen =
			this.app.uiManager.elements.gameModal?.open || this.app.uiManager.elements.gameMenu?.open || instructionsVisible;

		if (this.app.mode === 'game' && !isWelcoming && !isLoading && !isModalOpen) {
			this.openTouchInstructions();
		}
	}

	/**
	 * Show the touch instructions overlay and pause the game.
	 */
	openTouchInstructions() {
		this.hasSeenTouchTutorial = true;
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

		this.app.uiManager.elements.touchInstructions.classList.add('hidden');
		this.app.uiManager.elements.touchInstructions.setAttribute('aria-hidden', 'true');
		document.body.classList.remove('show-touch-zones');
		this.app.onModalClose();
	}
}
