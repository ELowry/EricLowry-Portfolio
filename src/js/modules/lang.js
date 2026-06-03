import { InputPrompts } from './inputPrompts.js';

/**
 * LangController manages multi-language support, translation logic, and persistence.
 */
class LangController {
	/**
	 * @property {Object|null} data - The current language data object containing strings.
	 * @property {Object|null} code - Current language codes { code, lang, region }.
	 * @property {string} dir - Directory where language JSON files are stored.
	 * @property {boolean} isLoaded - Whether the language system has finished loading and translating.
	 */
	constructor() {
		this.data = null;
		this.code = null;
		this.dir = '/lang/';
		this.isLoaded = false;
	}

	/**
	 * @returns {Array<Object>} the meta tag configuration for translation.
	 * @constant
	 */
	static get META_CONFIG() {
		return [
			{
				tag: 'title',
				path: 'meta.title',
			},
			{
				tag: 'meta',
				attr: 'name',
				attrVal: 'description',
				path: 'meta.description',
				targetAttr: 'content',
			},
			{
				tag: 'meta',
				attr: 'property',
				attrVal: 'og:title',
				path: 'meta.title',
				targetAttr: 'content',
			},
			{
				tag: 'meta',
				attr: 'property',
				attrVal: 'og:description',
				path: 'meta.description',
				targetAttr: 'content',
			},
			{
				tag: 'meta',
				attr: 'name',
				attrVal: 'language',
				path: 'meta.lang',
				targetAttr: 'content',
			},
			{
				tag: 'html',
				path: 'meta.lang',
				targetAttr: 'lang',
			},
			{
				tag: 'link',
				attr: 'id',
				attrVal: 'rss-feed-link',
				path: 'meta.rss',
				targetAttr: 'href',
			},
			{
				tag: 'link',
				attr: 'id',
				attrVal: 'rss-feed-link',
				path: 'meta.rssTitle',
				targetAttr: 'title',
			},
		];
	}

	/**
	 * Returns the current full language code (e.g., `en_US`).
	 * @returns {string} the full language code.
	 */
	get langCode() {
		return this.code ? this.code.code : 'en_US';
	}

	/**
	 * Initializes the language system by detecting the best language, fetching data, and translating the page.
	 * @returns {Promise<Object|null>} (resolves) with the loaded language data or null on failure.
	 */
	async init() {
		try {
			const browserLangs = this.#getBrowserLanguages();

			const response = await fetch(`${this.dir}langs.json`);
			if (!response.ok) {
				throw new Error('Could not load langs.json');
			}
			const availableLangs = await response.json();

			const bestLang = this.#determineBestLanguage(browserLangs, availableLangs);

			const splitLang = bestLang.split('_');
			this.code = {
				code: bestLang,
				lang: splitLang[0],
				region: splitLang[1] || '',
			};

			const dataResponse = await fetch(`${this.dir}${this.code.code}.json`);
			if (!dataResponse.ok) {
				throw new Error(`Could not load language file: ${this.code.code}.json`);
			}
			this.data = await dataResponse.json();

			document.documentElement.lang = this.getString(
				'meta.lang',
				this.data,
				this.code.lang
			).toLowerCase();

			this.performTranslation();
			this.setupLanguageSwitchers(availableLangs, bestLang);

			// Initialize input prompt handling
			await InputPrompts.init();

			this.isLoaded = true;
			document.body.classList.add('translated');

			return this.data;
		} catch (err) {
			console.error('Language initialization failed:', err);
			document.body.classList.add('translated');
			this.isLoaded = true;
			return null;
		}
	}

	/**
	 * Performs a translation pass on the specified document branch.
	 * @param {HTMLElement|Document} [root=document] - The root element to translate from.
	 * @param {Object} [data] - Optional language data to use (defaults to current data).
	 */
	performTranslation(root = document, data = this.data) {
		if (!data) {
			return;
		}

		this.translateMeta(data);
		this.translateHtml(root, data);
		this.translateAttr(root, data);
		this.applyRestrictions(root);
	}

	/**
	 * Detects browser languages and formats them to our internal scheme (e.g., `en_US`).
	 * @returns {string[]} an array of detected language codes.
	 * @private
	 */
	#getBrowserLanguages() {
		const langs =
			navigator.languages || (navigator.language ? [navigator.language] : ['en_US']);

		return langs.map((x) => {
			const y = x.split(/[-_]/);
			if (y.length <= 1) {
				return y[0].toLowerCase();
			}
			return y[0].toLowerCase() + '_' + y[1].toUpperCase();
		});
	}

	/**
	 * Determines the current best language based on URL, persistent storage, and browser settings.
	 * @param {string[]} browserLangs - Array of preferred languages from the browser.
	 * @param {Object} availableLangs - Map of languages available on the server.
	 * @returns {string} the best matching language code.
	 * @private
	 */
	#determineBestLanguage(browserLangs, availableLangs) {
		const urlParams = new URLSearchParams(window.location.search);
		const urlLang = urlParams.get('lang');

		// Handle language clearing via URL parameter
		if (urlLang === 'clear') {
			localStorage.removeItem('userLang');
			const url = new URL(window.location);
			url.searchParams.delete('lang');
			window.location.href = url.toString();
			return 'en_US';
		}

		// URL Parameter override
		if (urlLang) {
			const verified = this.#verifyLang(urlLang, availableLangs);
			if (verified) {
				return verified;
			}
		}

		// User Preference (Local Storage)
		const storedLang = localStorage.getItem('userLang');
		if (storedLang) {
			const verified = this.#verifyLang(storedLang, availableLangs);
			if (verified) {
				return verified;
			}
		}

		// Browser Language (Navigator)
		for (const code of browserLangs) {
			const verified = this.#verifyLang(code, availableLangs);
			if (verified) {
				return verified;
			}
		}

		return 'en_US';
	}

	/**
	 * Verifies if a given language code is available in the configuration.
	 * @param {string} verif - The language code to verify.
	 * @param {Object} availableLangs - Map of available languages.
	 * @returns {string|null} the verified language code or null if unavailable.
	 * @private
	 */
	#verifyLang(verif, availableLangs) {
		const parts = verif.split(/[-_]/);
		const prefix = parts[0].toLowerCase();

		if (!availableLangs[prefix]) {
			return null;
		}

		if (parts.length <= 1) {
			return availableLangs[prefix][0];
		}

		const fullCode = prefix + '_' + parts[1].toUpperCase();
		return availableLangs[prefix].includes(fullCode) ? fullCode : availableLangs[prefix][0];
	}

	/**
	 * Formats a string by replacing indexed placeholders like {0}, {1}.
	 * @param {string} str - The target string containing placeholders.
	 * @param {string[]} args - Values to inject into placeholders.
	 * @returns {string} the formatted string.
	 * @private
	 */
	#formatString(str, args) {
		return str.replace(/{(\d+)}/g, (match, number) => {
			return typeof args[number] !== 'undefined' ? args[number] : match;
		});
	}

	/**
	 * Handles newline processing for elements that require preserved line breaks.
	 * @param {string} str - The string to process.
	 * @param {boolean} isPre - Whether the target element is a <pre> block.
	 * @returns {string} the processed string.
	 * @private
	 */
	#processPreFormatting(str, isPre) {
		return isPre ? str.replace(/<br\s?\/?>/gm, '\n') : str;
	}

	/**
	 * Translates document meta tags (like title).
	 * @param {Object} data - The language data object.
	 */
	translateMeta(data) {
		const configList = LangController.META_CONFIG;

		for (const config of configList) {
			const elems = document.getElementsByTagName(config.tag);

			for (let i = 0; i < elems.length; i++) {
				const el = elems[i];

				if (config.attr) {
					if (
						!el.hasAttribute(config.attr)
						|| el.getAttribute(config.attr) !== config.attrVal
					) {
						continue;
					}
				}

				const target = this.getString(config.path, data);
				if (target === 'notFound') {
					continue;
				}

				const translated = config.props
					? this.#formatString(
							target,
							config.props.map((p) => {
								return typeof p === 'object' ? this.getString(p.path, data) : p;
							})
						)
					: target;

				if (config.tag === 'title') {
					document.title = translated;
				} else if (config.tag === 'html' && config.targetAttr === 'lang') {
					el.setAttribute(config.targetAttr, translated.toLowerCase());
				} else if (config.targetAttr) {
					el.setAttribute(config.targetAttr, translated);
				}
			}
		}
	}

	/**
	 * Translates innerHTML of elements marked with the `lang` class.
	 * @param {HTMLElement|Document} root - The root element to search within.
	 * @param {Object} data - The language data object.
	 */
	translateHtml(root, data) {
		const objs = root.querySelectorAll ? Array.from(root.querySelectorAll('.lang')) : [];
		const elements = root.classList?.contains('lang') ? [root, ...objs] : objs;

		for (let i = 0; i < elements.length; i++) {
			const el = elements[i];
			const path = el.dataset.lang;
			if (!path) {
				continue;
			}
			const target = this.getString(path, data);

			if (target === 'notFound') {
				el.classList.add('langHide');
			} else {
				el.classList.remove('langHide');

				const placeholders = el.innerHTML.match(/\u200B([^\u200B]+)\u200B/g);
				const isPre = el.nodeName.toLowerCase() === 'pre';

				let translated = target;
				if (placeholders && placeholders.length > 0) {
					translated = this.#formatString(target, placeholders);
				}

				el.innerHTML = this.#processPreFormatting(translated, isPre);
			}
		}
	}

	/**
	 * Translates specified attributes of elements marked with the `langAttr` class.
	 * @param {HTMLElement|Document} root - The root element to search within.
	 * @param {Object} data - The language data object.
	 */
	translateAttr(root, data) {
		const objs = root.querySelectorAll ? Array.from(root.querySelectorAll('.langAttr')) : [];
		const elements = root.classList?.contains('langAttr') ? [root, ...objs] : objs;

		for (let i = 0; i < elements.length; i++) {
			const el = elements[i];
			const attrName = el.dataset.langattr;
			if (!attrName) {
				continue;
			}
			const langAttrTag =
				'lang'
				+ attrName
					.substring(attrName.lastIndexOf('.') + 1)
					.toLowerCase()
					.replace('-', '_');
			const path = el.dataset[langAttrTag];

			if (!path) {
				continue;
			}

			const target = this.getString(path, data);

			if (target === 'notFound') {
				el.classList.add('langHide');
			} else {
				el.classList.remove('langHide');

				const rawValue = el.getAttribute(attrName) || '';
				const placeholders = rawValue.match(/\u200B([^\u200B]+)\u200B/g);

				if (placeholders && placeholders.length > 0) {
					el.setAttribute(attrName, this.#formatString(target, placeholders));
				} else {
					el.setAttribute(attrName, target);
				}
			}
		}
	}

	/**
	 * Toggles visibility based on `restrictLang` class and `dataset.restrict`.
	 * @param {HTMLElement|Document} [root=document] - The root element to search within.
	 */
	applyRestrictions(root = document) {
		const objs = root.querySelectorAll
			? Array.from(root.querySelectorAll('.restrictLang'))
			: [];
		const elements = root.classList?.contains('restrictLang') ? [root, ...objs] : objs;
		const currentLang = this.code?.lang;

		for (let i = 0; i < elements.length; i++) {
			const targetLang = elements[i].dataset.restrict;
			if (!targetLang || targetLang === currentLang) {
				elements[i].classList.add('langPresent');
			} else {
				elements[i].classList.remove('langPresent');
			}
		}
	}

	/**
	 * Returns a translated string from the loaded data object using a dot-path.
	 * @param {string} pathString - Dot-separated path to the target string.
	 * @param {Object} [data] - Data object to search (defaults to current data).
	 * @param {string} [fallback] - Optional fallback string if the target path is not found.
	 * @returns {string} the translated string, fallback, or `notFound`.
	 */
	getString(pathString, data = this.data, fallback = 'notFound') {
		const searchData = data || this.data;
		if (!searchData) {
			return fallback;
		}
		const path = pathString.split('.');
		let target = searchData;

		for (let i = 0; i < path.length; i++) {
			const key = path[i];
			if (!target || !Object.prototype.hasOwnProperty.call(target, key)) {
				console.warn(`Translation: no translation for "${pathString}"`);
				return fallback;
			}
			target = target[key];
		}
		return target;
	}

	/**
	 * Populates language switcher containers with buttons for each available language.
	 * Each button (except the current language) triggers a page reload with the new language.
	 * @param {Object} availableLangs - Map of languages from `langs.json`.
	 * @param {string} currentLang - The active full language code.
	 */
	setupLanguageSwitchers(availableLangs, currentLang) {
		const containers = document.querySelectorAll('.languageSwitcherButtons');

		for (let i = 0; i < containers.length; i++) {
			const container = containers[i];
			container.innerHTML = '';

			for (const prefix in availableLangs) {
				const codes = availableLangs[prefix];
				if (!Array.isArray(codes)) {
					continue;
				}

				codes.forEach((code) => {
					if (code === currentLang) {
						return;
					}

					const button = document.createElement('button');
					button.type = 'button';
					button.setAttribute('role', 'menuitem');
					button.setAttribute('tabindex', '-1');
					button.setAttribute('lang', code.split('_')[0]);

					const langName = this.getString(`languages.${code}`, null, code);
					const switchTemplate = this.getString('ui.btnSwitchLanguage');

					if (switchTemplate !== 'notFound') {
						button.textContent = switchTemplate.replace('{lang}', langName);
					} else {
						button.textContent = langName;
					}

					button.addEventListener('click', () => {
						localStorage.setItem('userLang', code);
						const url = new URL(window.location);
						url.searchParams.delete('lang');
						window.location.href = url.toString();
					});

					container.appendChild(button);
				});
			}
		}
	}
}

export const Lang = new LangController();
