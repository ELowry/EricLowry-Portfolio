/*
 * @type {boolean} Tracks if the lazy CSS chunk has been injected
 */
let isHighlightCssLoaded = false;

/**
 * @type {boolean} Tracks if the lazy CSS chunk has been injected
 */
let isNerdFontsCssLoaded = false;

/**
 * Dynamically loads the highlight.js core and specific language syntax rules.
 * @param {string} code - The raw source code to highlight.
 * @param {string} lang - The language identifier parsed from the markdown block.
 * @returns {Promise<string>} the formatted HTML string with syntax highlighting classes.
 */
export async function codeHighlight(code, lang) {
	if (!isNerdFontsCssLoaded) {
		await import('../../css/nerdFonts.lazy.css');
		isNerdFontsCssLoaded = true;
	}

	if (!lang) {
		return;
	}

	if (!isHighlightCssLoaded) {
		await import('../../css/highlight.lazy.css');
		isHighlightCssLoaded = true;
	}

	const hljs = (await import('highlight.js/lib/core')).default;

	if (lang && !hljs.getLanguage(lang)) {
		switch (lang) {
			case 'javascript':
			case 'js': {
				const js = (await import('highlight.js/lib/languages/javascript')).default;
				hljs.registerLanguage(lang, js);
				break;
			}
			case 'css': {
				const css = (await import('highlight.js/lib/languages/css')).default;
				hljs.registerLanguage(lang, css);
				break;
			}
			case 'html':
			case 'xml': {
				const xml = (await import('highlight.js/lib/languages/xml')).default;
				hljs.registerLanguage(lang, xml);
				break;
			}
			case 'md':
			case 'markdown': {
				const markdown = (await import('highlight.js/lib/languages/markdown')).default;
				hljs.registerLanguage(lang, markdown);
				break;
			}
		}
	}

	if (hljs.getLanguage(lang)) {
		return hljs.highlight(code, { language: lang }).value;
	}

	return code;
}
