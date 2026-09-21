import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ContentTree } from '../src/js/modules/content/contentTree.js';
import { resolveDotPath } from '../src/js/modules/core/sharedUtils.js';
import { Log } from './logger.mjs';

/**
 * Generates the sitemap.xml, llms.txt, and robots.txt files for search engines and AI crawlers.
 */
class SitemapGenerator {
	/**
	 * @returns {string} The base production URL for the website.
	 * @constant
	 */
	static get BASE_URL() {
		return 'https://eric-lowry.com';
	}

	/**
	 * @returns {Array<Object>} The list of standalone print documents to inject into llms.txt.
	 * @constant
	 */
	static get PRINTABLE_DOCS() {
		return [
			{
				file: 'cv-s.md',
				langKey: 'documents.cvShort',
				fallback: 'Eric Lowry - Condensed CV',
			},
			{
				file: 'cv.md',
				langKey: 'documents.cv',
				fallback: 'Eric Lowry - Full CV',
			},
		];
	}

	/**
	 * @returns {string} The resolved path to the public directory.
	 * @constant
	 */
	static get PUBLIC_DIR() {
		return path.join(path.dirname(fileURLToPath(import.meta.url)), '../public');
	}

	/**
	 * @returns {string} The resolved path to the content directory.
	 * @constant
	 */
	static get CONTENT_DIR() {
		return path.join(SitemapGenerator.PUBLIC_DIR, 'content');
	}

	/**
	 * Generates the formatted text content for the llms.txt file.
	 * @param {Object<string, Array<{title: string, file: string, language: string|undefined}>>} categorizedLinks - The structured map of content links.
	 * @param {Array<string>} languages - The array of available language codes.
	 * @returns {string} The formatted markdown string for llms.txt.
	 * @private
	 */
	static #generateLlmsContent(categorizedLinks, languages) {
		let printDocsSection = '';

		if (SitemapGenerator.PRINTABLE_DOCS.length > 0) {
			printDocsSection = `**__PDF Documents__**

The following links provide direct access to the raw markdown versions of PDF documents that are available for download on this website:
`;

			SitemapGenerator.PRINTABLE_DOCS.forEach((doc) => {
				languages.forEach((lang) => {
					const localeSuffix = SitemapGenerator.#getLangCode(lang);
					const label = SitemapGenerator.#getTranslation(lang, doc.langKey, doc.fallback);
					printDocsSection += `
- [${label} (${localeSuffix})](${SitemapGenerator.BASE_URL}/print/${lang}/${doc.file})`;
				});
			});
		}

		let content = `# Eric Lowry – Professional Portfolio & Systems Design

> This document serves as a machine-readable index of the portfolio and professional experience of Eric Lowry. It is designed to provide a comprehensive view of his work at the intersection of spatial design, interactive technology, and product strategy.

**__Professional Profile__**

Eric is a multidisciplinary designer and entrepreneur with over 10 years of experience. His career is defined by his ability to bridge the gap between technical systems and user-centric design.

**Core Expertise:**

- **Spatial Logic & Design**: Expertise in both physical architecture and digital spatial systems.
- **Interactive Systems**: Advanced development in Unity3D and vanilla JS for immersive training and gamified experiences.
- **Product Strategy**: Extensive experience in startup environments, B2B product lifecycles, and strategic leadership.
- **Information Architecture**: A strong focus on accessibility and standards-compliant digital infrastructure.

${printDocsSection}

**__Site Architecture__**

The portfolio is made available through two distinct interfaces:

1. **The Exploration Mode**: A bespoke, interactive 2D spatial environment that acts as a living demonstration of systems engineering and creative code.
2. **The Text-Based Mode**: A highly accessible, high-efficiency interface designed for rapid information retrieval and standards compliance.

`;

		for (const [category, nodes] of Object.entries(categorizedLinks)) {
			content += `
## ${category}

`;

			nodes.forEach((node) => {
				if (node.language) {
					const localeSuffix = SitemapGenerator.#getLangCode(node.language);
					content += `
- [${node.title} (${localeSuffix})](${SitemapGenerator.BASE_URL}/content/${node.language}/${node.file})`;
				} else {
					languages.forEach((lang) => {
						const localeSuffix = SitemapGenerator.#getLangCode(lang);
						content += `
- [${node.title} (${localeSuffix})](${SitemapGenerator.BASE_URL}/content/${lang}/${node.file})`;
					});
				}
			});
		}

		return content;
	}

	/**
	 * Gets the uppercase language code suffix from the given language code.
	 * @param {string} lang - The language code.
	 * @returns {string} The uppercase language code suffix.
	 * @private
	 */
	static #getLangCode(lang) {
		const parts = lang.split('_');
		return parts.length > 1 ? parts[0].toUpperCase() : '';
	}

	/**
	 * Fetches translated text from the localized JSON files.
	 * @param {string} langCode - The language code (e.g., 'en_US').
	 * @param {string} pathString - The dot-notation path to the translation key.
	 * @param {string} fallback - The fallback string if the key is not found.
	 * @returns {string} The resolved translation string.
	 * @private
	 */
	static #getTranslation(langCode, pathString, fallback) {
		const langFilePath = path.join(SitemapGenerator.PUBLIC_DIR, 'lang', `${langCode}.json`);
		if (!fs.existsSync(langFilePath)) {
			return fallback;
		}
		const langData = JSON.parse(fs.readFileSync(langFilePath, 'utf-8'));
		return resolveDotPath(pathString, langData, fallback);
	}

	/**
	 * Recursively traverses the content tree to collect sitemap URLs and build the LLM link structure.
	 * @param {import('../src/js/modules/content/contentTree.js').ContentNode} node - The current content node being processed.
	 * @param {Array<string>} pathSegments - The accumulated URL path segments for the current branch.
	 * @param {string} currentCategory - The active category title for the current branch.
	 * @param {Object} context - The shared state object accumulating URLs and links.
	 * @param {Array<Object>} context.sitemapUrls - The array collecting sitemap URL entries.
	 * @param {Object<string, Array<Object>>} context.llmLinks - The dictionary collecting LLM links by category.
	 * @param {string} context.today - The current date formatted as YYYY-MM-DD.
	 * @private
	 */
	static #traverseTree(node, pathSegments, currentCategory, context) {
		const currentId = node.id === 'root' ? '' : node.id;
		const newPathSegments = currentId ? [...pathSegments, currentId] : pathSegments;
		const currentPath = newPathSegments.join('/');
		const categoryTitle = node.type === 'category' ? node.title : currentCategory;

		if (node.type === 'content' && !node.hidden) {
			const textModeUrl = currentPath ? `/text/${currentPath}` : `/text`;

			let lastmod = context.today;
			if (node.file) {
				const mdPath = path.join(SitemapGenerator.CONTENT_DIR, 'en_US', node.file);
				if (fs.existsSync(mdPath)) {
					lastmod = fs.statSync(mdPath).mtime.toISOString().split('T')[0];
				}
			}

			const depth = newPathSegments.length;
			const priority = depth === 1 ? '0.8' : depth === 2 ? '0.6' : '0.5';

			context.sitemapUrls.push({
				url: `${SitemapGenerator.BASE_URL}${textModeUrl}`,
				title: `${node.title} – Eric Lowry`,
				lastmod,
				changefreq: 'monthly',
				priority,
			});
		}

		if (node.type === 'content' && node.file) {
			if (!context.llmLinks[categoryTitle]) {
				context.llmLinks[categoryTitle] = [];
			}

			const isDuplicate = context.llmLinks[categoryTitle].some((n) => {
				return n.file === node.file;
			});

			if (!isDuplicate) {
				context.llmLinks[categoryTitle].push({ title: node.title, file: node.file });
			}
		}

		if (node.children) {
			node.children.forEach((child) => {
				SitemapGenerator.#traverseTree(child, newPathSegments, categoryTitle, context);
			});
		}
	}

	/**
	 * Executes the generation sequence for sitemap.xml, llms.txt, and robots.txt.
	 * @returns {void}
	 */
	static run() {
		console.log('\n');

		const sitemapPath = path.join(SitemapGenerator.PUBLIC_DIR, 'sitemap.xml');
		const llmsPath = path.join(SitemapGenerator.PUBLIC_DIR, 'llms.txt');
		const robotsPath = path.join(SitemapGenerator.PUBLIC_DIR, 'robots.txt');

		const languages = fs.readdirSync(SitemapGenerator.CONTENT_DIR).filter((dir) => {
			const stat = fs.statSync(path.join(SitemapGenerator.CONTENT_DIR, dir));
			return stat.isDirectory() && dir !== 'obsidian';
		});

		const today = new Date().toISOString().split('T')[0];

		const context = {
			sitemapUrls: [
				{
					url: `${SitemapGenerator.BASE_URL}/`,
					lastmod: today,
					changefreq: 'monthly',
					priority: '1.0',
				},
				{
					url: `${SitemapGenerator.BASE_URL}/game`,
					lastmod: today,
					changefreq: 'monthly',
					priority: '0.9',
				},
			],
			llmLinks: {},
			today: today,
		};

		SitemapGenerator.#traverseTree(ContentTree, [], 'General', context);

		const blogJsonPath = path.join(SitemapGenerator.CONTENT_DIR, 'blog-index.json');

		if (fs.existsSync(blogJsonPath)) {
			const blogEntries = JSON.parse(fs.readFileSync(blogJsonPath, 'utf-8'));
			const blogCategoryTitle = 'Blog';

			if (!context.llmLinks[blogCategoryTitle]) {
				context.llmLinks[blogCategoryTitle] = [];
			}

			blogEntries.forEach((entry) => {
				context.sitemapUrls.push({
					url: `${SitemapGenerator.BASE_URL}/blog/${entry.date}`,
					lastmod: entry.date,
					changefreq: 'monthly',
					priority: '0.7',
				});

				context.llmLinks[blogCategoryTitle].push({
					title: entry.title,
					file: `blog/${entry.date}.md`,
					language: entry.language,
				});
			});
		}

		const publicFiles = fs.readdirSync(SitemapGenerator.PUBLIC_DIR);

		const feedFiles = publicFiles.filter((fileName) => {
			return fileName.startsWith('feed-') && fileName.endsWith('.xml');
		});

		feedFiles.forEach((feedName) => {
			context.sitemapUrls.push({
				url: `${SitemapGenerator.BASE_URL}/${feedName}`,
				lastmod: today,
				changefreq: 'daily',
				priority: '0.9',
			});
		});

		const pdfFiles = publicFiles.filter((fileName) => {
			return fileName.endsWith('.pdf');
		});

		pdfFiles.forEach((pdfName) => {
			const pdfPath = path.join(SitemapGenerator.PUBLIC_DIR, pdfName);
			let lastmod = today;

			if (fs.existsSync(pdfPath)) {
				lastmod = fs.statSync(pdfPath).mtime.toISOString().split('T')[0];
			}

			context.sitemapUrls.push({
				url: `${SitemapGenerator.BASE_URL}/${pdfName}`,
				lastmod: lastmod,
				changefreq: 'monthly',
				priority: '0.8',
			});
		});

		const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${context.sitemapUrls
	.map((entry) => {
		return `	<url>
		<loc>${entry.url}</loc>
		<lastmod>${entry.lastmod}</lastmod>
		<changefreq>${entry.changefreq}</changefreq>
		<priority>${entry.priority}</priority>
	</url>`;
	})
	.join('\n')}
</urlset>
`;

		// GENERATE SITEMAP.XML
		fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8');
		Log.success(`Generated sitemap.xml with ${context.sitemapUrls.length} URLs`);

		// GENERATE LLMS.TXT
		fs.writeFileSync(
			llmsPath,
			SitemapGenerator.#generateLlmsContent(context.llmLinks, languages),
			'utf-8'
		);
		Log.success(`Generated llms.txt`);

		// GENERATE ROBOTS.TXT
		const robotsContent = `User-agent: *
Allow: /

# Discovery
Sitemap: ${SitemapGenerator.BASE_URL}/sitemap.xml

# LLM-friendly index
# This is a machine-readable index of the site's content.
# More info at https://llms-txt.org/
# llms: ${SitemapGenerator.BASE_URL}/llms.txt
`;

		fs.writeFileSync(robotsPath, robotsContent, 'utf-8');
		Log.success('Generated robots.txt\n');
	}
}

SitemapGenerator.run();
