import { Events } from '../core/events.js';
import { Lang } from '../ui/lang.js';
import { Input } from './input.js';

/**
 * Controller for managing and updating input prompt elements in the DOM.
 * Listens for input type changes and updates all elements with the `[data-prompt]` attribute to display the correct prompt for the current input type (e.g., keyboard, controller).
 */
class InputPromptsController {
	/**
	 * @typedef {Object} GamepadPrompts
	 * @property {string} [default] - Default Xbox-style prompt.
	 * @property {string} [ps] - PlayStation-style prompt.
	 * @property {string} [switch] - Nintendo Switch-style prompt.
	 */

	/**
	 * @typedef {Object} DevicePrompts
	 * @property {string} mnk - Mouse and keyboard prompt or translation key.
	 * @property {string|GamepadPrompts} gamepad - Gamepad prompt string or mapped object.
	 * @property {string|null} touch - Touch prompt string, or null if hidden.
	 */

	/**
	 * @property {'mnk'|'touch'|'gamepad'} currentType - The active input device group.
	 * @property {'default'|'ps'|'switch'} gamepadType - The variant of the gamepad/controller.
	 * @property {Map<string, string>} layoutMap - Mapping for keyboard localized labels.
	 */
	constructor() {
		this.currentType = 'mnk';
		this.gamepadType = 'default';
		this.layoutMap = new Map();
	}

	/**
	 * Provides the mapping of input actions to their corresponding prompt representations.
	 * @returns {Object<string, DevicePrompts>} The mapped input actions.
	 * @constant
	 */
	static get PROMPT_MAPPING() {
		return {
			menu: {
				mnk: 'keys.escape',
				gamepad: '≡',
				touch: '≡',
			},
			back: {
				mnk: 'keys.escape',
				gamepad: {
					default: 'B',
					ps: '○',
					switch: 'A',
				},
				touch: '×',
			},
			interact: {
				mnk: 'E',
				gamepad: {
					default: 'A',
					ps: 'x',
					switch: 'B',
				},
				touch: '🖢',
			},
			up: {
				mnk: 'W',
				gamepad: '△',
				touch: null,
			},
			left: {
				mnk: 'A',
				gamepad: '◁',
				touch: null,
			},
			down: {
				mnk: 'S',
				gamepad: '▽',
				touch: null,
			},
			right: {
				mnk: 'D',
				gamepad: '▷',
				touch: null,
			},
			galleryClose: {
				mnk: 'x',
				gamepad: {
					default: 'B',
					ps: '○',
					switch: 'A',
				},
				touch: 'x',
			},
			galleryPrev: {
				mnk: '‹',
				gamepad: '◁',
				touch: '‹',
			},
			galleryNext: {
				mnk: '›',
				gamepad: '▷',
				touch: '›',
			},
		};
	}

	/**
	 * Initializes the input prompt module by detecting the current layout, setting up event listeners for input type and language changes, and refreshing the prompt state accordingly.
	 * @returns {Promise<void>} (resolves) when initialization is complete.
	 */
	async init() {
		await this.#detectKeyboardLayout();

		Events.on('input:typeChanged', (type) => {
			this.currentType = type;
			if (type === 'gamepad') {
				this.#detectGamepadType();
			}
			this.refresh();
		});

		window.addEventListener('gamepadconnected', () => {
			if (this.currentType === 'gamepad') {
				this.#detectGamepadType();
				this.refresh();
			}
		});

		Events.on('lang:changed', () => this.refresh());

		this.currentType = Input.lastInputType || 'mnk';
		if (this.currentType === 'gamepad') {
			this.#detectGamepadType();
		}
		this.refresh();
	}

	/**
	 * Scans the document for `[data-prompt]` elements and updates them.  
	 * Call manually when modifying HTML contents susceptible of displaying inputs.
	 * @param {HTMLElement} [root=document] - The root element to scan for prompt elements. Defaults to the main document.
	 * @returns {void} nothing
	 */
	refresh(root = document) {
		const promptElements = root.querySelectorAll('[data-prompt]');

		promptElements.forEach((prompt) => {
			const action = prompt.dataset.prompt;
			const typeToUse = prompt.dataset.inputForce || this.currentType;

			let content = this.#resolveBaseContent(action, typeToUse);

			if (content === null) {
				prompt.style.display = 'none';
				return;
			}

			prompt.style.display = '';
			prompt.dataset.activeDevice = typeToUse;

			if (typeToUse === 'mnk') {
				content = this.#applyKeyboardLayout(content);
			}

			content = this.#applyTranslation(content);

			prompt.innerHTML = content;
		});
	}

	/**
	 * Resolves the base prompt content for a given action and input type.
	 * @param {string} action - The action identifier (e.g., 'interact').
	 * @param {string} inputType - The input type to resolve for ('mnk', 'gamepad', or 'touch').
	 * @returns {string|null} The resolved content string, or null if hidden.
	 * @private
	 */
	#resolveBaseContent(action, inputType) {
		const mapping = InputPromptsController.PROMPT_MAPPING[action];
		if (!mapping) {
			return null;
		}

		let content = mapping[inputType];

		if (inputType === 'gamepad' && typeof content === 'object' && content !== null) {
			content = content[this.gamepadType] || content['default'];
		}

		return content;
	}

	/**
	 * Applies physical keyboard layout mappings for single-character MNK prompts.
	 * @param {string} content - The raw prompt content.
	 * @returns {string} The localized prompt content.
	 * @private
	 */
	#applyKeyboardLayout(content) {
		if (content.length === 1) {
			const mappedChar = this.layoutMap.get(content);
			if (mappedChar) {
				return mappedChar;
			}
		}
		return content;
	}

	/**
	 * Translates prompt content if it contains a translation key format.
	 * @param {string} content - The prompt content.
	 * @returns {string} The translated or original content.
	 * @private
	 */
	#applyTranslation(content) {
		if (content.includes('.')) {
			return Lang.getHtmlString(content, null, content);
		}
		return content;
	}

	/**
	 * Scans connected gamepads to identify the vendor/layout.
	 */
	#detectGamepadType() {
		const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
		for (const gamepad of gamepads) {
			if (!gamepad) {
				continue;
			}
			const id = gamepad.id.toLowerCase();

			if (id.includes('playstation') || id.includes('dual') || id.includes('054c')) {
				this.gamepadType = 'ps';
				return;
			}
			if (id.includes('switch') || id.includes('joy-con') || id.includes('057e')) {
				this.gamepadType = 'switch';
				return;
			}
		}
		this.gamepadType = 'default';
	}

	/**
	 * Detects the user's keyboard layout to properly display `WASD`/`ZQSD`/…  
	 * Prioritizes the native API, falls back to browser language.
	 */
	async #detectKeyboardLayout() {
		if (navigator.keyboard && navigator.keyboard.getLayoutMap) {
			try {
				const map = await navigator.keyboard.getLayoutMap();
				['A', 'D', 'E', 'S', 'W'].forEach((key) => {
					const mapped = map.get(`Key${key}`)?.toUpperCase();
					if (mapped && mapped !== key) {
						this.layoutMap.set(key, mapped);
					}
				});
				return;
			} catch (e) {
				console.warn('Layout detection failed, using fallback.', e);
			}
		}

		// Fallback
		const langs =
			navigator.languages || (navigator.language ? [navigator.language] : ['en_US']);
		const primaryLang = langs[0].split(/[-_]/)[0].toLowerCase();

		if (['fr', 'be', 'ch'].includes(primaryLang)) {
			this.layoutMap.set('A', 'Q');
			this.layoutMap.set('W', 'Z');
		}
	}
}

export const InputPrompts = new InputPromptsController();
