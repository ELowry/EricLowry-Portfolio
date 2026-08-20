import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ContentTree } from '../src/js/modules/content/contentTree.js';
import { Log } from './logger.mjs';

// SET DOMAIN NAME
const BASE_URL = 'https://eric-lowry.com';

/**
 * Generates the llms.txt content with categorized links.
 * @param {Object<string, Array<{title: string, file: string, language?: string}>>} categorizedLinks - The sorted links to include in the file.
 * @returns {string} The formatted llms.txt content.
 */
const generateLlmsContent = (categorizedLinks) => {
	let content = `# Eric Lowry – Professional Portfolio & Systems Design

> This document serves as a machine-readable index of the portfolio and professional experience of Eric Lowry. It is designed to provide a comprehensive view of his work at the intersection of spatial design, interactive technology, and product strategy.

**__Professional Profile__**

Eric is a multidisciplinary designer and entrepreneur with over 10 years of experience. His career is defined by his ability to bridge the gap between technical systems and user-centric design.

**Core Expertise:**

- **Spatial Logic & Design**: Expertise in both physical architecture and digital spatial systems.
- **Interactive Systems**: Advanced development in Unity3D and vanilla JS for immersive training and gamified experiences.
- **Product Strategy**: Extensive experience in startup environments, B2B product lifecycles, and strategic leadership.
- **Information Architecture**: A strong focus on accessibility and standards-compliant digital infrastructure.

**__Site Architecture__**

The portfolio demonstrates Eric's dual-threat capability through two distinct interfaces:

1. **The Exploration Mode**: A bespoke, interactive 2D spatial environment that acts as a living demonstration of systems engineering and creative code.
2. **The Text-Based Mode**: A highly accessible, high-efficiency interface designed for rapid information retrieval and standards compliance.

`;

	for (const [category, nodes] of Object.entries(categorizedLinks)) {
		content += `\n## ${category}\n\n`;
		nodes.forEach((node) => {
			if (node.language) {
				// Static language routing for blog posts
				const localeSuffix = node.language === 'en_US' ? 'EN' : 'FR';
				content += `- [${node.title} (${localeSuffix})](${BASE_URL}/content/${node.language}/${node.file})\n`;
			} else {
				// Global language routing for content tree documents
				languages.forEach((lang) => {
					const localeSuffix = lang === 'en_US' ? 'EN' : 'FR';
					content += `- [${node.title} (${localeSuffix})](${BASE_URL}/content/${lang}/${node.file})\n`;
				});
			}
		});
	}

	return content;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDirectory = path.join(__dirname, '../public');
const sitemapPath = path.join(publicDirectory, 'sitemap.xml');
const llmsPath = path.join(publicDirectory, 'llms.txt');
const contentDirectory = path.join(publicDirectory, 'content');

// Check available languages
const languages = fs.readdirSync(contentDirectory).filter((dir) => {
	const stat = fs.statSync(path.join(contentDirectory, dir));
	return stat.isDirectory() && dir !== 'obsidian';
});

const today = new Date().toISOString().split('T')[0];

const sitemapUrls = [
	{ url: `${BASE_URL}/`, lastmod: today, changefreq: 'monthly', priority: '1.0' },
	{ url: `${BASE_URL}/game`, lastmod: today, changefreq: 'monthly', priority: '0.9' },
];

const llmLinks = {}; // Keyed by category title

/**
 * Traverses the content tree to collect sitemap URLs and categorized LLM links.
 * @param {import('../src/js/modules/content/contentTree.js').ContentNode} node - The current node being processed.
 * @param {string[]} pathSegments - The accumulated URL path segments.
 * @param {string} currentCategory - The active category for the current branch.
 */
const traverseTree = (node, pathSegments = [], currentCategory = 'General') => {
	const currentId = node.id === 'root' ? '' : node.id;
	const newPathSegments = currentId ? [...pathSegments, currentId] : pathSegments;
	const currentPath = newPathSegments.join('/');

	// Update category if we enter a new one
	const categoryTitle = node.type === 'category' ? node.title : currentCategory;

	if (node.type === 'content' && !node.hidden) {
		const textModeUrl = currentPath ? `/text/${currentPath}` : `/text`;

		let lastmod = today;
		if (node.file) {
			const mdPath = path.join(contentDirectory, 'en_US', node.file);
			if (fs.existsSync(mdPath)) {
				lastmod = fs.statSync(mdPath).mtime.toISOString().split('T')[0];
			}
		}

		// Depth-based priority
		const depth = newPathSegments.length;
		const priority = depth === 1 ? '0.8' : depth === 2 ? '0.6' : '0.5';

		sitemapUrls.push({
			url: `${BASE_URL}${textModeUrl}`,
			title: `${node.title} – Eric Lowry`,
			lastmod,
			changefreq: 'monthly',
			priority,
		});
	}

	if (node.type === 'content' && node.file) {
		if (!llmLinks[categoryTitle]) {
			llmLinks[categoryTitle] = [];
		}
		// Add the node once per category, we'll iterate languages during output
		if (!llmLinks[categoryTitle].some((n) => n.file === node.file)) {
			llmLinks[categoryTitle].push({ title: node.title, file: node.file });
		}
	}

	if (node.children) {
		node.children.forEach((child) => traverseTree(child, newPathSegments, categoryTitle));
	}
};

console.log('\n');

traverseTree(ContentTree);

// ADD BLOG ITEMS TO SITEMAP AND LLMS.TXT
const blogJsonPath = path.join(contentDirectory, 'blog-index.json');
if (fs.existsSync(blogJsonPath)) {
	const blogEntries = JSON.parse(fs.readFileSync(blogJsonPath, 'utf-8'));

	const blogCategoryTitle = 'Blog';
	if (!llmLinks[blogCategoryTitle]) {
		llmLinks[blogCategoryTitle] = [];
	}

	blogEntries.forEach((entry) => {
		const textModeUrl = `/blog/${entry.date}`;
		sitemapUrls.push({
			url: `${BASE_URL}${textModeUrl}`,
			lastmod: entry.date,
			changefreq: 'monthly',
			priority: '0.7',
		});

		llmLinks[blogCategoryTitle].push({
			title: entry.title,
			file: `blog/${entry.date}.md`,
			language: entry.language,
		});
	});
}

// ADD RSS FEEDS TO SITEMAP
const publicFiles = fs.readdirSync(publicDirectory);
const feedFiles = publicFiles.filter((fileName) => {
	return fileName.startsWith('feed-') && fileName.endsWith('.xml');
});

feedFiles.forEach((feedName) => {
	sitemapUrls.push({
		url: `${BASE_URL}/${feedName}`,
		lastmod: today,
		changefreq: 'daily',
		priority: '0.9',
	});
});

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
	.map(
		(entry) =>
			`	<url>\n`
			+ `		<loc>${entry.url}</loc>\n`
			+ `		<lastmod>${entry.lastmod}</lastmod>\n`
			+ `		<changefreq>${entry.changefreq}</changefreq>\n`
			+ `		<priority>${entry.priority}</priority>\n`
			+ `	</url>`
	)
	.join('\n')}
</urlset>
`;

// GENERATE SITEMAP.XML
fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8');
Log.success(`Generated sitemap.xml with ${sitemapUrls.length} URLs`);

// GENERATE LLMS.TXT
fs.writeFileSync(llmsPath, generateLlmsContent(llmLinks), 'utf-8');
Log.success(`Generated llms.txt`);

// GENERATE ROBOTS.TXT
const robotsPath = path.join(publicDirectory, 'robots.txt');
const robotsContent = `User-agent: *
Allow: /

# Discovery
Sitemap: ${BASE_URL}/sitemap.xml

# LLM-friendly index
# This is a machine-readable index of the site's content.
# More info at https://llms-txt.org/
# llms: /llms.txt
`;

fs.writeFileSync(robotsPath, robotsContent, 'utf-8');
Log.success('Generated robots.txt\n');
