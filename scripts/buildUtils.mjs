/**
 * Injects HTML content into the <main> tag of a base HTML template.
 * @param {string} baseHtml - The raw HTML template string.
 * @param {string} newContent - The HTML/Markdown string to inject.
 * @returns {string} The updated HTML string.
 */
export function injectIntoMain(baseHtml, newContent) {
	if (!newContent) {
		return baseHtml;
	}

	const mainMatch = baseHtml.match(/(<main[^!>]+>)[\s\S]*?(<\/main>)/);

	if (mainMatch) {
		const prefix = baseHtml.substring(0, mainMatch.index) + mainMatch[1];
		const suffix = mainMatch[2] + baseHtml.substring(mainMatch.index + mainMatch[0].length);
		return prefix + newContent + suffix;
	}

	return baseHtml;
}
