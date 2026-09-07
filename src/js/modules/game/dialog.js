import { Engine } from '../core/engineContext.js';
import { Events } from '../core/events.js';
import { Input } from '../input/input.js';
import { Camera } from './camera.js';
import { Interaction } from './interaction.js';

/**
 * @typedef {Object} DialogChoice
 * @property {string} label - Button text.
 * @property {string} [langKey=''] - The label's translation key.
 * @property {string} [title=''] - The button's title property.
 * @property {string} [titleLangKey=''] - The title's translation key.
 * @property {() => void} [onSelected=undefined] - Callback when a choice is selected.
 */

/**
 * @typedef {Object} DialogStep
 * @property {string} [text=''] - Dialog text to display; or fallback string when using `element`.
 * @property {string} [textLangKey=''] - The dialog text's translation key.
 * @property {HTMLElement|null} [element=undefined] - DOM element to display (overrides `text`).
 * @property {() => void} [onEnter=undefined] - Event that fires at the start of the step.
 * @property {() => void} [onExit=undefined] - Event that fires when step completes.
 * @property {Array<DialogChoice>} [choices=[]] - Array of choice buttons.
 */

/**
 * Game-mode dialogue system as a basic step machine.
 */
class DialogController {
	/**
	 * Whether a dialogue sequence is ongoing.
	 * @type {boolean}
	 */
	isActive;

	/**
	 * The current sequence of dialogue steps.
	 * @type {Array<DialogStep>}
	 * @private
	 */
	#steps;

	/**
	 * The current dialogue step.
	 * @type {number}
	 * @private
	 */
	#currentStepIndex;

	/**
	 * (miliseconds) Timestamp of the last step change for input debouncing.
	 * @type {number}
	 * @private
	 */
	#lastAdvanceTime;

	constructor() {
		this.isActive = false;
		this.#steps = [];
		this.#currentStepIndex = 0;
		this.#lastAdvanceTime = 0;
	}

	/**
	 * Game loop update.  
	 * Handles input debouncing and standard touch inputs when in dialog mode.
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
	 * Executes the current dialog step.
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
				payload.choices = step.choices.map((choice) => ({
					label: choice.label,
					langKey: choice.langKey,
					title: choice.title,
					titleLangKey: choice.titleLangKey,
					onSelected: () => {
						if (typeof choice.onSelected === 'function') {
							choice.onSelected();
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
	 * Starts a dialogue sequence.
	 * @param {Array<DialogStep>} sequence - The sequence of dialogue steps.
	 */
	play(sequence) {
		if (!sequence || sequence.length === 0) {
			return;
		}
		if (this.isActive) {
			this.end();
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
	 * Ends the current dialogue sequence.  
	 * Hides the dialog interface.
	 */
	end() {
		if (!this.isActive) {
			return;
		}
		const currentStep = this.#steps[this.#currentStepIndex];
		if (typeof currentStep?.onExit === 'function') {
			currentStep.onExit();
		}
		this.isActive = false;
		Events.emit('dialog:hide');
		Interaction.setInputDebounce();
	}

	/**
	 * Site/game intro sequence.
	 * @param {Object} player - The player instance.
	 * @param {(gameMode: string) => void} onModeSet - Callback to change the app mode.
	 */
	playIntro(player, onModeSet) {
		this.play([
			{
				textLangKey: 'ui.welcome.d1',
				text: 'Hi there! My name is Eric Lowry, welcome to my interactive portfolio!\nYou can start by pressing that button over there 🢆',
				onEnter: () => {
					Camera.setZoom(100, {
						duration: 5,
						ease: Engine.LJS.Ease.OUT(Engine.LJS.Ease.POWER(2)),
						panEase: Engine.LJS.Ease.LINEAR(),
					});
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
						langKey: 'ui.welcome.btnGame',
						label: 'Interactive Mode',
						title: 'Continue the interactive experience.',
						titleLangKey: 'ui.welcome.btnGameTitle',
					},
					{
						langKey: 'ui.welcome.btnText',
						label: 'Text Mode',
						title: 'Browse the site in a standard accessible web format.',
						titleLangKey: 'ui.welcome.btnTextTitle',
						onSelected: () => {
							Camera.setZoom();
							onModeSet('text');
							this.end();
						},
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
						title: 'Start exploring the portfolio environment',
						titleLangKey: 'ui.welcome.btnContinueTitle',
						onSelected: () => {
							Camera.setZoom(Camera.DEFAULT_SCALE, {
								duration: 4,
								ease: Engine.LJS.Ease.BEZIER(0.15, 0.05, 0.3, 1),
								panEase: Engine.LJS.Ease.LINEAR(),
							});
						},
					},
				],
			},
		]);
	}
}

export const Dialog = new DialogController();
