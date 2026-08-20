import fs from 'fs/promises';
import { marked } from 'marked';
import path from 'path';

import { ContentTree } from '../src/js/modules/content/contentTree.js';
import {
	escapeHtml,
	parseImageVariant,
	resolveDotPath,
} from '../src/js/modules/core/sharedUtils.js';
import { injectIntoMain } from './buildUtils.mjs';
import { Log } from './logger.mjs';

const BASE_URL = 'https://eric-lowry.com';
const LANG_DIR = path.resolve('public/lang');
const CONTENT_DIR = path.resolve('public/content');

const langsConfig = JSON.parse(await fs.readFile(path.join(LANG_DIR, 'langs.json'), 'utf-8'));
const availableLangs = Object.values(langsConfig).flat();
const defaultLang = 'en_US';
const enLangData = JSON.parse(
	await fs.readFile(path.join(LANG_DIR, `${defaultLang}.json`), 'utf-8')
);

const baseHtmlContent = await fs.readFile('index.html', 'utf-8');

/**
 * Fetches translated text from the loaded JSON data using dot notation.
 * @param {string} pathString - The dot-separated path to the translation key.
 * @param {string} fallback - The string to return if the key is not found.
 * @returns {string} the resolved string.
 */
function getTranslation(pathString, fallback) {
	return resolveDotPath(pathString, enLangData, fallback);
}

/**
 * Generates the hreflang alternate links for SEO based on available languages.
 * @param {string} routePath - The current route path.
 * @returns {string} the formatted HTML link tags.
 */
function generateHrefLangs(routePath) {
	return availableLangs
		.map((lang) => {
			const langCode = lang.replace('_', '-').toLowerCase();
			return `<link rel="alternate" hreflang="${langCode}" href="${BASE_URL}/__MODE__/${routePath}?lang=${lang}" />`;
		})
		.join('\n\t\t');
}

/**
 * Recursively collects asynchronous page generation tasks.
 * @param {Object} node - The current content node.
 * @param {string} [currentPath=''] - The accumulated route path.
 * @param {Array<Promise<void>>} [tasks=[]] - The accumulated array of async tasks.
 * @returns {Array<Promise<void>>} The complete array of generation tasks.
 */
function collectGenerationTasks(node, currentPath = '', tasks = []) {
	if (node.type === 'separator') {
		return tasks;
	}

	let nodePath = '';
	if (currentPath) {
		nodePath = node.id === 'root' ? currentPath : `${currentPath}/${node.id}`;
	} else {
		nodePath = node.id === 'root' ? '' : node.id;
	}

	if (nodePath && nodePath !== 'blog' && nodePath !== 'projects') {
		tasks.push(generateStaticPage(node, nodePath));
	}

	if (node.children) {
		node.children.forEach((child) => {
			collectGenerationTasks(child, nodePath, tasks);
		});
	}

	return tasks;
}

/**
 * Reads node metadata, injects it into the base HTML, and writes the static file asynchronously.
 * @param {Object} node - The current content node.
 * @param {string} routePath - The resolved route path for the node.
 */
async function generateStaticPage(node, routePath) {
	let effectiveNode = node;

	if (node.type === 'category' && node.children) {
		const mainChild = node.children.find((c) => {
			return c.id === node.id;
		});
		if (mainChild) {
			effectiveNode = mainChild;
		}
	}

	const pathKey = routePath.replace(/\//g, '.');
	const titleKey = `content.${pathKey}.title`;
	const descKey = `content.${pathKey}.description`;

	const pageTitle = getTranslation(titleKey, effectiveNode.title || routePath.split('/').pop());
	const pageDesc = getTranslation(descKey, getTranslation('meta.description', ''));
	const hrefLangs = generateHrefLangs(routePath);

	const safeTitle = escapeHtml(pageTitle);
	const safeDesc = escapeHtml(pageDesc);

	let ogImage = `${BASE_URL}/assets/images/eric_lowry_portrait__240-240-webp_240-240.jpg`;
	let ogWidth = '1200';
	let ogHeight = '630';

	if (effectiveNode.image) {
		const parsedImg = parseImageVariant(effectiveNode.image);
		ogImage = `${BASE_URL}${parsedImg.url}`;
		ogWidth = parsedImg.width;
		ogHeight = parsedImg.height;
	}

	let markdownContent = '';
	if (effectiveNode.file) {
		const mdPath = path.join(CONTENT_DIR, defaultLang, effectiveNode.file);
		try {
			const rawMd = await fs.readFile(mdPath, 'utf-8');
			markdownContent = marked.parse(rawMd);
		} catch (error) {}
	}

	const replacementMeta = `<!-- OG_META_START -->
		<title>${safeTitle} – Eric Lowry</title>
		
		<meta name="description" content="${safeDesc}" />
		<meta name="author" content="Eric Lowry" />
		<meta name="language" content="EN" />

		<meta name="theme-color" content="#e29186" />
		<meta name="theme-color" content="#6d0a1f" media="(prefers-color-scheme: light)" />

		<link rel="canonical" href="${BASE_URL}/__MODE__/${routePath}" />
		${hrefLangs}
		<link rel="alternate" hreflang="x-default" href="${BASE_URL}/__MODE__/${routePath}" />

		<meta property="og:site_name" content="Eric Lowry – Portfolio" />
		<meta property="og:locale" content="en_US" />
		<meta property="og:title" content="${safeTitle}" />
		<meta property="og:type" content="article" />
		<meta property="og:url" content="${BASE_URL}/__MODE__/${routePath}" />
		<meta property="og:description" content="${safeDesc}" />
		<meta property="og:image" content="${ogImage}" />
		<meta property="og:image:type" content="image/jpeg" />
		<meta property="og:image:width" content="${ogWidth}" />
		<meta property="og:image:height" content="${ogHeight}" />
		<meta property="og:image:alt" content="${safeTitle}" />

		<meta name="twitter:card" content="summary_large_image" />
	<!-- OG_META_END -->`;

	const outDir = path.join('.static-html', 'content', routePath);
	await fs.mkdir(outDir, { recursive: true });

	const updatedHtml = baseHtmlContent.replace(
		/<!-- OG_META_START -->[\s\S]*?<!-- OG_META_END -->/,
		() => replacementMeta
	);

	await fs.writeFile(
		path.join(outDir, 'index.html'),
		injectIntoMain(updatedHtml, markdownContent),
		'utf-8'
	);
	Log.success(`Generated static wrapper for: /${routePath}`);
}

/**
 * Run static content generation process.
 */
async function run() {
	Log.info('\nGenerating Static Content Wrappers...');
	const tasks = collectGenerationTasks(ContentTree);
	await Promise.all(tasks);
}

run();
