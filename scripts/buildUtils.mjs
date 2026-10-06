import fs from 'fs';
import path from 'path';

import { Log } from './logger.mjs';

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

/**
 * Safely loads environment variables from a `.env` file.  
 * Fallback for missing system environment variables.
 * @returns {void}
 */
export function loadEnv() {
	try {
		const envPath = path.resolve(process.cwd(), '.env');
		if (fs.existsSync(envPath)) {
			const envContent = fs.readFileSync(envPath, 'utf-8');
			envContent.split(/\r?\n/).forEach((line) => {
				const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
				if (match) {
					process.env[match[1]] = match[2].trim().replace(/(^['"]|['"]$)/g, '');
				}
			});
		}
	} catch {
		// No .env
	}

	if (!process.env.GITHUB_BASIC_TOKEN) {
		Log.warn(
			'No GITHUB_BASIC_TOKEN found in environment or .env file. API rate limits will apply.'
		);
	} else {
		Log.success('GITHUB_BASIC_TOKEN loaded successfully.');
	}
}
