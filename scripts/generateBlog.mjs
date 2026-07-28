import fs from 'fs';
import path from 'path';
import { Log } from './logger.mjs';
import { marked } from 'marked';
import { createCanvas } from 'canvas';
import { resolveDotPath, escapeHtml } from '../src/js/modules/sharedUtils.js';

const CONTENT_DIR = 'public/content';
const OUTPUT_FILE = 'public/content/blog-index.json';
const BASE_URL = 'https://eric-lowry.com';
const IMAGE_BASE_DIR = 'public/assets/images/blog';

/**
 * Generates the blog-index.json index file and feed-{lang_code}.xml files by parsing markdown files in the `public/content/{languageCode}/blog` directories.
 * Looks for files matching YYYY-MM-DD.md and extracts the highest-order heading as the title.
 * @returns {void} Nothing
 */
function generateBlog() {
	console.log('\n');
	if (!fs.existsSync(CONTENT_DIR)) {
		Log.warn(`Content directory ${CONTENT_DIR} not found.`);
		process.exit(1);
	}

	const blogEntries = [];
	const seenDates = new Set();
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

			if (seenDates.has(date)) {
				throw new Error(
					`\nCRITICAL BUILD ERROR: Blog date collision detected for "${date}".\n`
						+ `Dates act as unique IDs. You cannot have multiple posts on the same day.`
				);
			}
			seenDates.add(date);

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
				Log.error(`Error: No heading found in blog post ${filePath}`);
				process.exit(1);
			}

			blogEntries.push({
				language: lang,
				title: bestTitle,
				date: date,
			});

			generateStaticImage(bestTitle, date);

			// Generate static blog item pages
			const baseHtmlTemplate = fs.readFileSync('index.html', 'utf-8');
			generateStaticBlogHtml(
				{
					language: lang,
					title: bestTitle,
					date: date,
				},
				baseHtmlTemplate,
				content
			);
		}
	}

	// Sort by date descending
	blogEntries.sort((a, b) => {
		if (a.date > b.date) return -1;
		if (a.date < b.date) return 1;
		return 0;
	});

	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(blogEntries, null, 2));
	Log.success(`Generated ${OUTPUT_FILE} with ${blogEntries.length} entries.`);

	// GENERATE RSS FEEDS
	const buildDate = new Date().toUTCString();

	// Group entries by language
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

		const rssItems = entries
			.map((entry) => {
				const pubDate = new Date(entry.date).toUTCString();
				const link = `${BASE_URL}/blog/${entry.date}?lang=${entry.language}`;
				const datePath = entry.date.replace(/-/g, '');
				const imageRelPath = `/assets/images/blog/${datePath}/poster.png`;
				const imageUrl = `${BASE_URL}${imageRelPath}`;
				const localImagePath = path.join(IMAGE_BASE_DIR, datePath, `poster.png`);

				let fileSize = 0;
				if (fs.existsSync(localImagePath)) {
					fileSize = fs.statSync(localImagePath).size;
				}

				return `\t\t<item>
\t\t\t<title>${entry.title}</title>
\t\t\t<link>${link}</link>
\t\t\t<guid isPermaLink="false">eric-lowry-blog-${entry.date}-${entry.language}</guid>
\t\t\t<pubDate>${pubDate}</pubDate>
\t\t\t<enclosure url="${imageUrl}" length="${fileSize}" type="image/png" />
\t\t</item>`;
			})
			.join('\n');
		const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
\t<channel>
\t\t<atom:link href="${BASE_URL}/feed-${lang}.xml" rel="self" type="application/rss+xml" />
\t\t<title>${feedTitle}</title>
\t\t<link>${BASE_URL}/blog</link>
\t\t<description>${feedDesc}</description>
\t\t<image>
\t\t\t<url>https://eric-lowry.com/assets/images/eric_lowry_portrait__240-240-webp_240-240.jpg</url>
\t\t\t<title>${feedTitle}</title>
\t\t\t<link>${BASE_URL}/blog</link>
\t\t\t<width>144</width>
\t\t\t<height>144</height>
\t\t</image>
\t\t<language>${rssLangCode}</language>
\t\t<lastBuildDate>${buildDate}</lastBuildDate>
${rssItems}
\t</channel>
</rss>`;

		fs.writeFileSync(feedFile, rssContent, 'utf-8');
		Log.success(
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
	return resolveDotPath(pathString, langData, fallback);
}

/**
 * Generates a static PNG image for a blog post.
 * @param {string} title - The title of the blog post.
 * @param {string} date - The date of the blog post (e.g., '2026-05-31').
 */
function generateStaticImage(title, date) {
	const datePath = date.replace(/-/g, '');
	const dirPath = path.join(IMAGE_BASE_DIR, datePath);
	const targetImagePath = path.join(dirPath, `poster.png`);
	const metaFilePath = path.join(dirPath, `poster.meta`);

	// Check if the title has changed
	if (fs.existsSync(targetImagePath) && fs.existsSync(metaFilePath)) {
		const cachedTitle = fs.readFileSync(metaFilePath, 'utf-8');
		if (cachedTitle === title) {
			Log.info(`SKIPPED existing poster image: ${date}`);
			return;
		}
	}

	const width = 1200;
	const height = 630;
	const canvas = createCanvas(width, height);
	const context = canvas.getContext('2d');

	// Background
	context.fillStyle = '#0f0d0f';
	context.fillRect(0, 0, width, height);

	// Text color
	context.fillStyle = '#d1c6c1';

	// Name
	context.font = 'bold 22pt "Space Grotesk"';
	context.textAlign = 'left';
	context.textBaseline = 'top';
	context.fillText('Eric Lowry', 290, 30);

	// Date
	context.font = 'bold 22pt "Space Grotesk"';
	context.textAlign = 'right';
	context.textBaseline = 'bottom';
	context.fillText(date, width - 290, height - 30);

	// Title
	const maxLineWidth = 600;
	const maxTotalHeight = 360;
	const lineHeight = 1.3;

	let fontSize = 80;
	let lines;

	do {
		context.font = `normal ${fontSize}pt VT323`;
		lines = [];
		let currentLine = '';
		const words = title.split(' ');

		for (let i = 0; i < words.length; i++) {
			const testLine = currentLine + words[i] + ' ';
			const metrics = context.measureText(testLine);

			if (metrics.width > maxLineWidth && i > 0) {
				lines.push(currentLine.trim());
				currentLine = words[i] + ' ';
			} else {
				currentLine = testLine;
			}
		}
		lines.push(currentLine.trim());

		const totalHeight = lines.length * (fontSize * lineHeight);

		if (totalHeight <= maxTotalHeight) {
			break;
		}

		fontSize -= 4;
	} while (fontSize > 28);

	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.fillStyle = '#e29186';

	const totalBlockHeight = lines.length * (fontSize * lineHeight);
	const startY = height / 2 - totalBlockHeight / 2 + fontSize / 2;

	lines.forEach((line, index) => {
		const yPos = startY + index * fontSize * lineHeight;
		context.fillText(line, width / 2, yPos);
	});

	// Render
	const buffer = canvas.toBuffer('image/png');

	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}

	fs.writeFileSync(path.join(dirPath, `poster.png`), buffer);

	fs.writeFileSync(metaFilePath, title, 'utf-8');
	Log.info(`Generated new poster image for ${date}`);
}

/**
 * Generates a static HTML wrapper for open graph crawlers.
 * @param {Object} entry - The blog entry object from the index.
 * @param {string} baseHtmlContent - The raw content of the main index.html file.
 * @param {string} content - The raw markdown content of the blog post.
 */
function generateStaticBlogHtml(entry, baseHtmlContent, content) {
	const postDirectory = path.join('.static-html', 'blog', entry.date);

	if (!fs.existsSync(postDirectory)) {
		fs.mkdirSync(postDirectory, { recursive: true });
	}

	const datePath = entry.date.replace(/-/g, '');
	const imagePath = `/assets/images/blog/${datePath}/poster.png`;
	const imageUrl = `${BASE_URL}${imagePath}`;

	const safeTitle = escapeHtml(entry.title);

	const replacementMeta = `<!-- OG_META_START -->
		<title>${safeTitle} – Eric Lowry</title>
		
		<meta name="description" content="${safeTitle} – Published on ${entry.date}." />
		<meta name="author" content="Eric Lowry" />
		<meta name="language" content="${entry.language === 'en_US' ? 'EN' : 'FR'}" />

		<meta name="theme-color" content="#e29186" />
		<meta name="theme-color" content="#6d0a1f" media="(prefers-color-scheme: light)" />

		<link rel="canonical" href="https://eric-lowry.com/blog/${entry.date}" />

		<meta property="og:site_name" content="Eric Lowry – Portfolio" />
		<meta property="og:locale" content="${entry.language}" />
		<meta property="og:title" content="${safeTitle}" />
		<meta property="og:type" content="article" />
		<meta property="og:url" content="https://eric-lowry.com/blog/${entry.date}" />
		<meta property="og:description" content="${safeTitle} – Published on ${entry.date}." />
		<meta property="og:image" content="${imageUrl}" />
		<meta property="og:image:type" content="image/png" />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta property="og:image:alt" content="${safeTitle}" />
		
		<meta name="twitter:card" content="summary_large_image" />
	<!-- OG_META_END -->`;

	const parsedMarkdown = marked.parse(content);
	let updatedHtml = baseHtmlContent.replace(
		/<!-- OG_META_START -->[\s\S]*?<!-- OG_META_END -->/,
		() => replacementMeta
	);
	const mainMatch = updatedHtml.match(/(<main[^!>]+>)[\s\S]*?(<\/main>)/);
	if (mainMatch) {
		const prefix = updatedHtml.substring(0, mainMatch.index) + mainMatch[1];
		const suffix = mainMatch[2] + updatedHtml.substring(mainMatch.index + mainMatch[0].length);
		updatedHtml = prefix + parsedMarkdown + suffix;
	}

	fs.writeFileSync(path.join(postDirectory, 'index.html'), updatedHtml, 'utf-8');
}

generateBlog();
