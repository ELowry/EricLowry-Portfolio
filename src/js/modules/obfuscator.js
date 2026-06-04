import { App } from '../app.js';
import { Lang } from './lang.js';

/**
 * Utilities for obfuscating text, providing a marked.js extension, and processing obfuscated DOM elements to deter automated scraping.
 */
export class Obfuscator {
	/**
	 * @returns {string} the name identifier for the marked.js extension.
	 * @constant
	 */
	static get EXTENSION_NAME() {
		return 'obfuscator';
	}

	/**
	 * @returns {string} the target CSS selector for encoded payload elements in the DOM.
	 * @constant
	 */
	static get TARGET_SELECTOR() {
		return '.obfuscated-content';
	}

	/**
	 * Reverses a string.
	 * @param {string} str - The string to reverse.
	 * @returns {string} the reversed string.
	 * @private
	 */
	static #reverse(str) {
		return str.split('').reverse().join('');
	}

	/**
	 * Applies ROT13 transformation to a string.
	 * @param {string} str - The string to apply ROT13 to.
	 * @returns {string} the ROT13 transformed string.
	 * @private
	 */
	static #rot13(str) {
		return str.replace(/[a-zA-Z]/g, (c) => {
			const base = c <= 'Z' ? 65 : 97;
			return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
		});
	}

	/**
	 * Checks if a string is valid Base64.
	 * @param {string} string - The string to check.
	 * @returns {boolean} true if the string is valid Base64, false otherwise.
	 * @private
	 */
	static #isBase64(string) {
		try {
			if (/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string)) {
				return true;
			}
		} catch (e) {}
		return false;
	}

	/**
	 * Converts characters randomly to hex or decimal HTML entities.
	 * Ensures non-Latin1 characters are converted to safely pass through base64 encoding.
	 * @param {string} text - The text to convert to entities.
	 * @returns {string} the text converted to entities.
	 * @private
	 */
	static #encodeToEntities(text) {
		let output = '';

		for (let i = 0; i < text.length; i++) {
			const charCode = text.charCodeAt(i);
			const formatChance = Math.random();

			if (charCode > 255 || formatChance < 0.33) {
				output += `&#${charCode};`;
			} else if (formatChance < 0.66) {
				output += `&#x${charCode.toString(16)};`;
			} else {
				output += text[i];
			}
		}

		return output;
	}

	/**
	 * @returns {Array<Object>} the array of custom extensions for marked.js.
	 * @private
	 */
	static #getMarkedExtensions() {
		return [
			{
				name: Obfuscator.EXTENSION_NAME,
				level: 'inline',
				/**
				 * Hints to the marked.js parser where the next token starts.
				 * Required for inline extensions to function correctly mid-string.
				 * @param {string} src - The source string to search.
				 * @returns {number|undefined} the index of the next token, or undefined if not found.
				 */
				start(src) {
					return src.match(/(?:&#8203;|\u200B)/)?.index;
				},
				/**
				 * Tokenizer for matching text bounded by zero-width spaces.
				 * @param {string} src - The source string to tokenize.
				 * @returns {Object|void} the tokenized content, or void if no match found.
				 */
				tokenizer(src) {
					const rule = /^(?:&#8203;|\u200B)(.*?)(?:&#8203;|\u200B)/;
					const match = rule.exec(src);

					if (match) {
						return {
							type: Obfuscator.EXTENSION_NAME,
							raw: match[0],
							text: match[1],
						};
					}
				},
				/**
				 * Renders the obfuscated token into a safe HTML structure for DOM injection.
				 * @param {Object} token - The token to render.
				 * @returns {string} the rendered HTML for the token.
				 */
				renderer(token) {
					const payload = token.text.trim();
					if (Obfuscator.#isBase64(payload)) {
						return `<span class="${Obfuscator.TARGET_SELECTOR.replace('.', '')}" data-payload="${payload}" data-nosnippet></span>`;
					}
					const entityString = Obfuscator.#encodeToEntities(payload);
					const encodedPayload = Obfuscator.obfuscateUnlessBase64(entityString);

					return `<span class="${Obfuscator.TARGET_SELECTOR.replace('.', '')}" data-payload="${encodedPayload.obfuscated}" data-nosnippet></span>`;
				},
			},
		];
	}

	/**
	 * @returns {Object} the custom renderer object for marked.js.
	 * @private
	 */
	static #getMarkedRenderer() {
		return {
			/**
			 * Custom renderer for links, handling email and phone obfuscation.
			 * @param {Object} token - The marked token for the link.
			 * @returns {string|boolean} the rendered HTML for the link, or false to fall back.
			 */
			link(token) {
				let { href, title, text } = token;
				const isMail = href && href.startsWith('mailto:');
				const isPhone = href && href.startsWith('tel:');

				if (isMail || isPhone) {
					if (typeof navigator !== 'undefined') {
						const isCrawler = /bot|crawler|spider|crawling|slurp|yandex/i.test(
							navigator.userAgent || ''
						);
						if (navigator.webdriver || isCrawler) {
							return `<span class="protected-link" data-nosnippet></span>`;
						}
					}

					let value = isMail ? href.replace('mailto:', '') : href.replace('tel:', '');

					let decodedText;
					try {
						const { obfuscated, deobfuscated } = Obfuscator.obfuscateUnlessBase64(text);
						text = obfuscated;
						decodedText = deobfuscated;
					} catch (e) {
						decodedText = text;
					}

					try {
						const { obfuscated } = Obfuscator.obfuscateUnlessBase64(value);
						value = obfuscated;
					} catch (e) {}

					const hasEmail = decodedText.includes('@');
					const hasPhone = /[\d\s+\-()]{7,}/.test(decodedText);

					let displayText = text;
					let isObfuscated = false;

					if ((isMail && hasEmail) || (isPhone && hasPhone)) {
						displayText = Lang.getString(
							`ui.contact.${isMail ? 'email' : 'phone'}Placeholder`,
							null,
							isMail ? '[Reveal Email]' : '[Reveal Phone]'
						);
						isObfuscated = true;
					}

					return `
				<a href="#" 
					class="protected-link" 
					data-enc="${value}"
					data-text-enc="${text}"
					data-type="${isMail ? 'mailto' : 'tel'}"
					${isObfuscated ? 'data-obfuscated-text="true"' : ''}
					${title ? `title="${title}"` : ''}
					data-nosnippet
				>${displayText}</a>`;
				}

				return false;
			},
		};
	}

	/**
	 * Extracts the decoding logic to be reusable.
	 * @param {HTMLAnchorElement} link
	 * @private
	 */
	static #decodeLink(link) {
		if (link.href.startsWith('mailto:') || link.href.startsWith('tel:')) {
			return;
		}

		const encodedHref = link.getAttribute('data-enc');
		const encodedText = link.getAttribute('data-text-enc');
		const type = link.getAttribute('data-type') || 'mailto';

		if (encodedHref) {
			try {
				const value = Obfuscator.deobfuscate(encodedHref);
				link.href = `${type}:${value}`;

				if (link.dataset.obfuscatedText === 'true' && encodedText) {
					link.textContent = Obfuscator.deobfuscate(encodedText);
					link.removeAttribute('data-obfuscated-text');
				}

				link.classList.remove('protected-link');
				if (!App.isLocal) {
					link.removeAttribute('data-enc');
					link.removeAttribute('data-text-enc');
					link.removeAttribute('data-type');
				}
			} catch (e) {
				console.error('Failed to decode contact information');
			}
		}
	}

	/**
	 * Obfuscates a string.
	 * @param {string} str - The string to obfuscate.
	 * @returns {string} the obfuscated string.
	 */
	static obfuscate(str) {
		if (!str) {
			return '';
		}
		try {
			let output = btoa(
				encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
					String.fromCharCode(Number('0x' + p1))
				)
			);
			output = Obfuscator.#reverse(output);
			output = Obfuscator.#rot13(output);
			output = btoa(output);
			return output;
		} catch (e) {
			console.error('Obfuscation failed:', e);
			return str;
		}
	}

	/**
	 * Deobfuscates a string.
	 * @param {string} str - The string to deobfuscate.
	 * @returns {string} the deobfuscated string.
	 */
	static deobfuscate(str) {
		if (!str) {
			return '';
		}
		try {
			let output = atob(str);
			output = Obfuscator.#rot13(output);
			output = Obfuscator.#reverse(output);
			output = atob(output);
			output = decodeURIComponent(
				output
					.split('')
					.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
					.join('')
			);
			return output;
		} catch (e) {
			try {
				return atob(str);
			} catch (inner) {
				return str;
			}
		}
	}

	/**
	 * Obfuscates text unless it appears to be valid Base64, in which case it attempts to decode it.
	 * Useful for handling user input that may already be obfuscated or encoded.
	 * @param {string} text - The text to obfuscate.
	 * @returns {Object} An object containing both the obfuscated and deobfuscated versions of the text.
	 */
	static obfuscateUnlessBase64(text) {
		const trimmedText = text.trim();
		let decodedText = '';
		try {
			if (Obfuscator.#isBase64(trimmedText)) {
				const decoded = Obfuscator.deobfuscate(trimmedText);
				if (decoded !== trimmedText) {
					decodedText = decoded;
				} else {
					text = Obfuscator.obfuscate(text);
				}
			} else {
				decodedText = text;
				text = Obfuscator.obfuscate(text);
			}
		} catch (e) {
			decodedText = text;
		}

		return { obfuscated: text, deobfuscated: decodedText };
	}

	/**
	 * Generates the marked.js extension configuration object.
	 * Used to parse zero-width space delimited text and securely encode it.
	 * @returns {Object} an object containing both extensions and a renderer.
	 */
	static getMarkedExtension() {
		return {
			extensions: Obfuscator.#getMarkedExtensions(),
			renderer: Obfuscator.#getMarkedRenderer(),
		};
	}

	/**
	 * Decodes payloads and renders entities into the target container element post-injection.
	 * @param {HTMLElement} containerElement - The container element to process.
	 * @returns {void} nothing
	 */
	static processDomElements(containerElement) {
		if (!containerElement) {
			return;
		}

		if (navigator.webdriver) {
			return;
		}

		const elements = containerElement.querySelectorAll(Obfuscator.TARGET_SELECTOR);

		if (typeof navigator !== 'undefined') {
			const isCrawler = /bot|crawler|spider|crawling|slurp|yandex/i.test(
				navigator.userAgent || ''
			);
			if (isCrawler) {
				for (let i = 0; i < elements.length; i++) {
					elements[i].removeAttribute('data-payload');
				}
				return;
			}
		}

		for (let i = 0; i < elements.length; i++) {
			const el = elements[i];
			const payload = el.getAttribute('data-payload');

			if (payload) {
				el.innerHTML = Obfuscator.deobfuscate(payload);
				if (App.isLocal) {
					continue;
				}
				el.removeAttribute('data-payload');
				el.classList.remove('obfuscated-content');
			}
		}
	}

	/**
	 * Decodes and restores obfuscated mailto or tel links upon user interaction.
	 * @param {Event} event - The focus or mouseover event.
	 */
	static restoreProtectedLink(event) {
		const target = event?.target;
		if (!target || typeof target.closest !== 'function') {
			return;
		}

		const link = target.closest('.protected-link');
		if (!link) {
			return;
		}

		// On touch devices (no hover capability), the first tap reveals, and the second tap clicks.
		const canHover = window.matchMedia('(hover: hover)').matches;
		if ((event.type === 'mouseover' || event.type === 'focus') && !canHover) {
			return;
		}

		if (link.href.startsWith('mailto:') || link.href.startsWith('tel:')) {
			return;
		}

		// First click reveals and prevents navigation; subsequent clicks navigate normally.
		if (event.type === 'click') {
			event.preventDefault();
		}

		Obfuscator.#decodeLink(link);

		const encodedHref = link.getAttribute('data-enc');
		const encodedText = link.getAttribute('data-text-enc');
		const type = link.getAttribute('data-type') || 'mailto';

		if (encodedHref) {
			try {
				const value = Obfuscator.deobfuscate(encodedHref);
				link.href = `${type}:${value}`;

				if (link.dataset.obfuscatedText === 'true' && encodedText) {
					link.textContent = Obfuscator.deobfuscate(encodedText);
					link.removeAttribute('data-obfuscated-text');
				}

				link.classList.remove('protected-link');
				if (!App.isLocal) {
					link.removeAttribute('data-enc');
					link.removeAttribute('data-text-enc');
					link.removeAttribute('data-type');
				}
			} catch (e) {
				console.error('Failed to decode contact information');
			}
		}
	}

	/**
	 * Finds all remaining protected links on the page and decodes them.
	 * Designed to be hooked to the browser's 'beforeprint' event.
	 */
	static revealAllForPrint() {
		const links = document.querySelectorAll('.protected-link');
		for (let i = 0; i < links.length; i++) {
			Obfuscator.#decodeLink(links[i]);
		}
	}
}
