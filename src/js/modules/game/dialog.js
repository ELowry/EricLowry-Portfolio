import { Engine } from '../core/engineContext.js';
import { Events } from '../core/events.js';
import { Input } from '../input/input.js';
import { Camera } from './camera.js';
import { Interaction } from './interaction.js';

/**
 * @typedef {Object} DialogChoice
 * @property {string} label - The fallback text displayed on the button.
 * @property {string} [langKey] - Optional translation key for the label.
 * @property {Function} [action] - The callback when the choice is selected.
 */

/**
 * @typedef {Object} DialogStep
 * @property {string} [text] - Fallback string or raw text to display.
 * @property {string} [textLangKey] - Optional translation key for the text.
 * @property {HTMLElement} [element] - Optional DOM element to display instead of text.
 * @property {Function} [onEnter] - Logic to fire when step starts.
 * @property {Function} [onExit] - Logic to fire when step completes.
 * @property {Array<DialogChoice>} [choices] - Array of choice buttons to present.
 */

/**
 * Manages the in-game dialogue system, executing step-by-step sequences.
 */
class DialogController {
	/** @type {boolean} */
	isActive;
	/** @type {Array<DialogStep>} */
	#steps;
	/** @type {number} */
	#currentStepIndex;
	/** @type {number} */
	#lastAdvanceTime;

	/**
	 * Creates an instance of DialogController.
	 */
	constructor() {
		this.isActive = false;
		this.#steps = [];
		this.#currentStepIndex = 0;
		this.#lastAdvanceTime = 0;
	}

	/**
	 * Updates the dialogue state each frame, handling user interactions.
	 */
	update() {
		if (!this.isActive) {
			return;
		}

		if (performance.now() - this.#lastAdvanceTime < 150) {
			return;
		}

		const step = this.#steps[this.#currentStepIndex];
		if (!step.choices || step.choices.length === 0) {
			if (Input.interact) {
				Input.spawnTapRipple();
				this.advance();
				Input.clearEvents();
			}
		}
	}

	/**
	 * Executes the current step in the dialogue sequence.
	 * @private
	 */
	#executeStep() {
		if (this.#currentStepIndex >= this.#steps.length) {
			this.end();
			return;
		}

		const step = this.#steps[this.#currentStepIndex];

		if (typeof step.onEnter === 'function') {
			step.onEnter();
		}

		if (step.text || step.textLangKey || step.element) {
			const payload = {
				text: step.text,
				textLangKey: step.textLangKey,
				element: step.element,
				choices: [],
			};

			if (step.choices) {
				payload.choices = step.choices.map((c) => ({
					label: c.label,
					langKey: c.langKey,
					action: () => {
						if (typeof c.action === 'function') {
							c.action();
						}

						if (this.isActive) {
							this.advance();
						}
					},
				}));
			}

			Events.emit('dialog:show', payload);
		}
	}

	/**
	 * Starts playing a new dialogue sequence.
	 * @param {Array<DialogStep>} sequence - The array of dialogue steps to play.
	 */
	play(sequence) {
		if (!sequence || sequence.length === 0) {
			return;
		}
		this.#steps = sequence;
		this.#currentStepIndex = 0;
		this.isActive = true;
		this.#executeStep();
	}

	/**
	 * Advances the dialogue sequence to the next step.
	 */
	advance() {
		this.#lastAdvanceTime = performance.now();
		const step = this.#steps[this.#currentStepIndex];
		if (typeof step.onExit === 'function') {
			step.onExit();
		}
		this.#currentStepIndex++;
		this.#executeStep();
	}

	/**
	 * Ends the current dialogue sequence and hides the interface.
	 */
	end() {
		this.isActive = false;
		Events.emit('dialog:hide');
		// Prevent accidental world interaction immediately after closing
		Interaction.setBlock();
	}

	/**
	 * Intro Cinematic sequence.
	 * @param {Object} player - The player instance to animate.
	 * @param {Function} setModeCallback - Callback to transition the app mode.
	 */
	playIntro(player, setModeCallback) {
		this.play([
			{
				textLangKey: 'ui.welcome.d1',
				text: 'Hi there! My name is Eric Lowry, welcome to my interactive portfolio!\nYou can start by pressing that button over there 🢆',
				onEnter: () => {
					Camera.setZoom(
						100,
						5,
						Engine.LJS.Ease.OUT(Engine.LJS.Ease.POWER(2)),
						Engine.LJS.Ease.LINEAR()
					);
					if (player) {
						player.setState('wave');
					}
				},
				onExit: () => {
					if (player) {
						player.setState('idle');
					}
				},
			},
			{
				textLangKey: 'ui.welcome.d2',
				text: 'Accessibility is important on the web! So if you prefer to explore my portfolio as a standard website, please select "Text Mode", otherwise you can continue this interactive experience:',
				choices: [
					{
						langKey: 'ui.welcome.btnText',
						label: 'Text Mode',
						action: () => {
							Camera.setZoom();
							setModeCallback('text');
							this.end();
						},
					},
					{
						langKey: 'ui.welcome.btnGame',
						label: 'Interactive Mode',
					},
				],
			},
			{
				textLangKey: 'ui.welcome.d3',
				text: 'If at any time you need to change modes, or check the controls for this experience, you can press the <kbd data-prompt="menu">[Esc]</kbd> key.',
			},
			{
				textLangKey: 'ui.welcome.d4',
				text: "⚠ WARNING: I'm currently working on the environments and art assets for each area 🛠 so things are a bit baren at the moment. But all the important information is there!",
			},
			{
				textLangKey: 'ui.welcome.d5',
				text: 'You can walk around freely, enter doors, and read sign posts to explore my portfolio. These are placeholder assets, and should look much fancier in the future…',
				choices: [
					{
						langKey: 'ui.welcome.btnContinue',
						label: 'Start Exploring',
						action: () => {
							Camera.setZoom(
								Camera.DEFAULT_SCALE,
								4,
								Engine.LJS.Ease.BEZIER(0.15, 0.05, 0.3, 1),
								Engine.LJS.Ease.LINEAR()
							);
						},
					},
				],
			},
		]);
	}
}

export const Dialog = new DialogController();
