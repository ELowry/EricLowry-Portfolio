import fs from 'fs';
import path from 'path';

const CONTENT_DIR = 'public/content';
const OUTPUT_FILE = 'public/content/blog-index.json';
const BASE_URL = 'https://eric-lowry.com';

/**
 * Generates the blog-index.json index file and feed-{lang_code}.xml files by parsing markdown files in the `public/content/{languageCode}/blog` directories.
 * Looks for files matching YYYY-MM-DD.md and extracts the highest-order heading as the title.
 * @returns {void} Nothing
 */
function generateBlogIndex() {
	if (!fs.existsSync(CONTENT_DIR)) {
		console.error(`Content directory ${CONTENT_DIR} not found.`);
		process.exit(1);
	}

	const blogEntries = [];
	const dateRegex = /^(\d{4}-\d{2}-\d{2})\.md$/;
	const headingRegex = /^(#{1,6})\s+(.+)$/m;

	// Iterate over content language folders
	const langFolders = fs.readdirSync(CONTENT_DIR).filter((item) => {
		return fs.statSync(path.join(CONTENT_DIR, item)).isDirectory();
	});

	for (const lang of langFolders) {
		const blogDir = path.join(CONTENT_DIR, lang, 'blog');
		if (!fs.existsSync(blogDir) || !fs.statSync(blogDir).isDirectory()) {
			continue;
		}

		const files = fs.readdirSync(blogDir);
		for (const file of files) {
			const dateMatch = file.match(dateRegex);
			if (!dateMatch) {
				continue;
			}

			const date = dateMatch[1];
			const filePath = path.join(blogDir, file);
			const content = fs.readFileSync(filePath, 'utf-8');

			let bestTitle = null;
			let bestLevel = 7; // H1-H6

			let match;
			const regexGlobal = new RegExp(headingRegex.source, 'gm');

			while ((match = regexGlobal.exec(content)) !== null) {
				const level = match[1].length; // number of '#' characters
				if (level < bestLevel) {
					bestLevel = level;
					bestTitle = match[2].trim();
				}
				if (bestLevel === 1) {
					break;
				}
			}

			if (!bestTitle) {
				console.error(`Error: No heading found in blog post ${filePath}`);
				process.exit(1);
			}

			blogEntries.push({
				language: lang,
				title: bestTitle,
				date: date,
			});
		}
	}

	// Sort by date descending
	blogEntries.sort((a, b) => {
		if (a.date > b.date) return -1;
		if (a.date < b.date) return 1;
		return 0;
	});

	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(blogEntries, null, 2));
	console.log(`Generated ${OUTPUT_FILE} with ${blogEntries.length} entries.`);

	// GENERATE RSS FEEDS
	const buildDate = new Date().toUTCString();

	// Group entries by language (Removed 'acc' abbreviation)
	const entriesByLanguage = blogEntries.reduce((groupedEntries, entry) => {
		if (!groupedEntries[entry.language]) {
			groupedEntries[entry.language] = [];
		}
		groupedEntries[entry.language].push(entry);
		return groupedEntries;
	}, {});

	// Generate separate feed files for each language
	for (const [lang, entries] of Object.entries(entriesByLanguage)) {
		const feedFile = `public/feed-${lang}.xml`;
		const rssLangCode = lang.replace('_', '-').toLowerCase();

		// Fetch translations for the feed channel metadata
		const feedTitle = getTranslationNode(lang, 'blog.feedTitle', `Eric Lowry - Blog (${lang})`);
		const feedDesc = getTranslationNode(
			lang,
			'blog.feedDescription',
			'Latest blog posts from Eric Lowry.'
		);

		let rssContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
		rssContent += `<rss version="2.0">\n`;
		rssContent += `\t<channel>\n`;
		rssContent += `\t\t<title>${feedTitle}</title>\n`;
		rssContent += `\t\t<link>${BASE_URL}/blog</link>\n`;
		rssContent += `\t\t<description>${feedDesc}</description>\n`;
		rssContent += `\t\t<language>${rssLangCode}</language>\n`;
		rssContent += `\t\t<lastBuildDate>${buildDate}</lastBuildDate>\n`;

		entries.forEach((entry) => {
			const pubDate = new Date(entry.date).toUTCString();
			const link = `${BASE_URL}/blog/${entry.date}?lang=${entry.language}`;
			rssContent += `\t\t<item>\n`;
			rssContent += `\t\t\t<title>${entry.title}</title>\n`;
			rssContent += `\t\t\t<link>${link}</link>\n`;
			rssContent += `\t\t\t<guid>eric-lowry-blog-${entry.date}-${entry.language}</guid>\n`;
			rssContent += `\t\t\t<pubDate>${pubDate}</pubDate>\n`;
			rssContent += `\t\t</item>\n`;
		});

		rssContent += `\t</channel>\n`;
		rssContent += `</rss>\n`;

		fs.writeFileSync(feedFile, rssContent, 'utf-8');
		console.log(
			`Generated RSS feed for ${lang} at ${feedFile} with ${entries.length} entries.`
		);
	}
}

/**
 * Fetch translated text from JSON files
 * @param {string} langCode - Language code (e.g., 'en_US')
 * @param {string} pathString - Dot notation path to translation key (e.g., 'meta.title')
 * @param {string} fallback - Fallback value if translation not found
 * @returns {string} - Translated text
 */
function getTranslationNode(langCode, pathString, fallback) {
	const langFilePath = path.join('public', 'lang', `${langCode}.json`);

	if (!fs.existsSync(langFilePath)) {
		return fallback;
	}

	const langData = JSON.parse(fs.readFileSync(langFilePath, 'utf-8'));
	const keys = pathString.split('.');
	let target = langData;

	for (const key of keys) {
		if (!target || !Object.prototype.hasOwnProperty.call(target, key)) {
			return fallback;
		}
		target = target[key];
	}

	return target;
}

generateBlogIndex();
