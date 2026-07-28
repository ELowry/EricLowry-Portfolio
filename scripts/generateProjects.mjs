import fs from 'fs/promises';
import path from 'path';
import util from 'util';
import crypto from 'crypto';
import { Log } from './logger.mjs';
import { marked } from 'marked';
import { exec } from 'child_process';
import { escapeHtml } from '../src/js/modules/sharedUtils.js';

const execAsync = util.promisify(exec);

/**
 * Generates local markdown files and a JSON index for configured GitHub repositories.
 */
class ProjectGenerator {
	/**
	 * @returns {string} the GitHub username.
	 * @constant
	 */
	static get GITHUB_USER() {
		return 'ELowry';
	}

	/**
	 * @returns {Array<string>} the list of repositories to fetch.
	 * @constant
	 */
	static get REPOSITORIES() {
		return [
			'DNSToggle',
			'MarkedResponsiveImages',
			'WinGet-Updater',
			'obsidian-replace-commands',
			'obsidian-format-with-prettier',
		];
	}

	/**
	 * @returns {string} the target directory for the markdown files.
	 * @constant
	 */
	static get CONTENT_DIR() {
		return path.resolve('public/content/en_US/projects');
	}

	/**
	 * @returns {string} the target path for the JSON index.
	 * @constant
	 */
	static get INDEX_PATH() {
		return path.resolve('public/content/projects-index.json');
	}

	/**
	 * @returns {string} the base directory for generated images.
	 * @constant
	 */
	static get IMAGE_BASE_DIR() {
		return path.resolve('public/assets/images/projects');
	}

	/**
	 * Rewrites relative URLs in the markdown to point to absolute GitHub paths.
	 *
	 * @param {string} markdown - The raw markdown text.
	 * @param {string} repo - The repository name.
	 * @param {string} branch - The branch name.
	 * @returns {string} The processed markdown text.
	 * @private
	 */
	static #rewriteRelativeUrls(markdown, repo, branch) {
		let processed = markdown;

		// Markdown Images first
		const mdImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
		processed = processed.replace(mdImgRegex, (match, alt, url) => {
			const trimmedUrl = url.trim();
			if (
				trimmedUrl.startsWith('http')
				|| trimmedUrl.startsWith('//')
				|| trimmedUrl.startsWith('data:')
			) {
				return match;
			}

			const cleanUrl = trimmedUrl.replace(/^\//, '');
			const absoluteUrl = `https://raw.githubusercontent.com/${ProjectGenerator.GITHUB_USER}/${repo}/${branch}/${cleanUrl}`;

			return `![${alt}](${absoluteUrl})`;
		});

		// Markdown Links
		const mdLinkRegex = /(?<!!)\[((?:\[[^\]]*\]|[^\]])*)\]\(([^)]+)\)/g;
		processed = processed.replace(mdLinkRegex, (match, text, url) => {
			const trimmedUrl = url.trim();
			if (
				trimmedUrl.startsWith('http')
				|| trimmedUrl.startsWith('//')
				|| trimmedUrl.startsWith('#')
				|| trimmedUrl.startsWith('mailto:')
			) {
				return match;
			}

			const cleanUrl = trimmedUrl.replace(/^\//, '');
			const absoluteUrl = `https://github.com/${ProjectGenerator.GITHUB_USER}/${repo}/blob/${branch}/${cleanUrl}`;

			return `[${text}](${absoluteUrl})`;
		});

		// HTML Images
		const htmlImgRegex = /<img([^>]+)src="([^"]+)"([^>]*)>/gi;
		processed = processed.replace(htmlImgRegex, (match, before, url, after) => {
			const trimmedUrl = url.trim();
			if (
				trimmedUrl.startsWith('http')
				|| trimmedUrl.startsWith('//')
				|| trimmedUrl.startsWith('data:')
			) {
				return match;
			}

			const cleanUrl = trimmedUrl.replace(/^\//, '');
			const absoluteUrl = `https://raw.githubusercontent.com/${ProjectGenerator.GITHUB_USER}/${repo}/${branch}/${cleanUrl}`;

			return `<img${before}src="${absoluteUrl}"${after}>`;
		});

		// HTML Anchors
		const htmlAnchorRegex = /<a([^>]+)href="([^"]+)"([^>]*)>/gi;
		processed = processed.replace(htmlAnchorRegex, (match, before, url, after) => {
			const trimmedUrl = url.trim();
			if (
				trimmedUrl.startsWith('http')
				|| trimmedUrl.startsWith('//')
				|| trimmedUrl.startsWith('#')
				|| trimmedUrl.startsWith('mailto:')
			) {
				return match;
			}

			const cleanUrl = trimmedUrl.replace(/^\//, '');
			const absoluteUrl = `https://github.com/${ProjectGenerator.GITHUB_USER}/${repo}/blob/${branch}/${cleanUrl}`;

			return `<a${before}href="${absoluteUrl}"${after}>`;
		});

		// Strip dummy wrapper links for images
		processed = processed.replace(/\[\s*(!\[.*?\]\(.*?\))\s*\]\(#\)/g, '$1');

		return processed;
	}

	/**
	 * Generates a static HTML wrapper for Open Graph crawlers.
	 * @param {Object} data - The repository metadata and markdown.
	 * @private
	 */
	static async #generateStaticProjectHtml(data) {
		const baseHtmlContent = await fs.readFile('index.html', 'utf-8');
		const postDirectory = path.join('.static-html', 'projects', data.id);

		await fs.mkdir(postDirectory, { recursive: true });

		const imageUrl = `https://eric-lowry.com/assets/images/projects/${data.id}/poster.jpg`;

		const safeTitle = escapeHtml(data.title);
		const safeDesc = escapeHtml(data.description);

		const replacementMeta = `<!-- OG_META_START -->
		<title>${safeTitle} – Eric Lowry</title>
		
		<meta name="description" content="${safeDesc}" />
		<meta name="author" content="Eric Lowry" />
		<meta name="language" content="EN" />

		<meta name="theme-color" content="#e29186" />
		<meta name="theme-color" content="#6d0a1f" media="(prefers-color-scheme: light)" />

		<link rel="canonical" href="https://eric-lowry.com/projects/${data.id}" />

		<meta property="og:site_name" content="Eric Lowry – Portfolio" />
		<meta property="og:locale" content="en_US" />
		<meta property="og:title" content="${safeTitle}" />
		<meta property="og:type" content="article" />
		<meta property="og:url" content="https://eric-lowry.com/projects/${data.id}" />
		<meta property="og:description" content="${safeDesc}" />
		<meta property="og:image" content="${imageUrl}" />
		<meta property="og:image:type" content="image/jpeg" />
		<meta property="og:image:width" content="${data.ogImageWidth}" />
		<meta property="og:image:height" content="${data.ogImageHeight}" />
		<meta property="og:image:alt" content="${safeTitle}" />

		<meta name="twitter:card" content="summary_large_image" />
	<!-- OG_META_END -->`;

		// Dynamically import marked so it parses the HTML correctly
		const parsedMarkdown = marked.parse(data.readme);
		let updatedHtml = baseHtmlContent.replace(
			/<!-- OG_META_START -->[\s\S]*?<!-- OG_META_END -->/,
			() => replacementMeta
		);
		const mainMatch = updatedHtml.match(/(<main[^!>]+>)[\s\S]*?(<\/main>)/);
		if (mainMatch) {
			const prefix = updatedHtml.substring(0, mainMatch.index) + mainMatch[1];
			const suffix =
				mainMatch[2] + updatedHtml.substring(mainMatch.index + mainMatch[0].length);
			updatedHtml = prefix + parsedMarkdown + suffix;
		}

		await fs.writeFile(path.join(postDirectory, 'index.html'), updatedHtml, 'utf-8');
	}

	/**
	 * Fetches repository metadata and raw README markdown from the GitHub API.
	 *
	 * @param {string} repo - The name of the repository to fetch.
	 * @param {Object|undefined} cachedEntry - The previous metadata entry from the JSON index.
	 * @returns {Promise<Object>} An object containing the repository's metadata and README text (if fetched).
	 * @private
	 */
	static async #fetchRepoData(repo, cachedEntry) {
		const apiRes = await fetch(
			`https://api.github.com/repos/${ProjectGenerator.GITHUB_USER}/${repo}`
		);

		if (!apiRes.ok) {
			throw new Error(`API fetch failed for ${repo}: ${apiRes.statusText}`);
		}

		const meta = await apiRes.json();

		if (meta.private || meta.visibility === 'private') {
			throw new Error('Repository is private');
		}

		if (cachedEntry && cachedEntry.updatedAt === meta.updated_at) {
			const mdPath = path.join(ProjectGenerator.CONTENT_DIR, `${repo}.md`);
			const imgPath = path.join(ProjectGenerator.IMAGE_BASE_DIR, repo, `poster.jpg`);
			try {
				await fs.access(mdPath);
				await fs.access(imgPath); // Verify the local image actually exists
				return { ...cachedEntry, skipWrite: true };
			} catch (error) {}
		}

		const branch = meta.default_branch || 'main';
		const readmeRes = await fetch(
			`https://raw.githubusercontent.com/${ProjectGenerator.GITHUB_USER}/${repo}/${branch}/README.md`
		);

		if (!readmeRes.ok) {
			throw new Error(`README fetch failed for ${repo}: ${readmeRes.statusText}`);
		}

		let readmeText = await readmeRes.text();
		readmeText = ProjectGenerator.#rewriteRelativeUrls(readmeText, repo, branch);

		// Get Open Graph image from GitHub
		const htmlRes = await fetch(`https://github.com/${ProjectGenerator.GITHUB_USER}/${repo}`);
		// Fallback to GitHub's auto-generator
		let ogImageUrl = `https://opengraph.githubassets.com/1/${ProjectGenerator.GITHUB_USER}/${repo}`;

		if (htmlRes.ok) {
			const htmlText = await htmlRes.text();
			const match = htmlText.match(/<meta property="og:image" content="([^"]+)"/i);
			if (match) {
				ogImageUrl = match[1];
			}
		}

		let localImagePath = null;
		let imgWidth = 1200;
		let imgHeight = 630;
		try {
			const imgRes = await fetch(ogImageUrl);
			if (imgRes.ok) {
				const arrayBuffer = await imgRes.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);

				const repoImgDir = path.join(ProjectGenerator.IMAGE_BASE_DIR, repo);
				await fs.mkdir(repoImgDir, { recursive: true });

				const tempHash = crypto.randomBytes(4).toString('hex');
				const tempInputPath = path.join(repoImgDir, `temp_${tempHash}.tmp`);
				const finalOutputPath = path.join(repoImgDir, `poster.jpg`);

				await fs.writeFile(tempInputPath, buffer);

				await execAsync(
					`powershell -Command "magick '${tempInputPath}' -resize '1200x630^' -gravity center -extent '1200x630' -quality 85 '${finalOutputPath}'"`
				);

				const { stdout } = await execAsync(
					`powershell -Command "magick identify -format '%w,%h' '${finalOutputPath}'"`
				);

				const [w, h] = stdout.trim().split(',');
				if (w && h) {
					imgWidth = parseInt(w, 10);
					imgHeight = parseInt(h, 10);
				}

				await fs.unlink(tempInputPath);
				localImagePath = `/assets/images/projects/${repo}/poster.jpg`;
			}
		} catch (imgError) {
			Log.warn(`   -> Failed to process OG image for ${repo}: ${imgError.message}`);
		}

		return {
			id: repo,
			title: meta.name,
			description: meta.description || '',
			url: meta.html_url,
			stars: meta.stargazers_count,
			tech: meta.language,
			updatedAt: meta.updated_at,
			date: meta.updated_at.split('T')[0],
			readme: readmeText,
			ogImage: localImagePath || ogImageUrl,
			ogImageWidth: imgWidth,
			ogImageHeight: imgHeight,
			skipWrite: false,
		};
	}

	/**
	 * Executes the fetch sequence, writes markdown files, and generates the index JSON.
	 *
	 * @returns {Promise<void>}
	 */
	static async run() {
		Log.info('\nGenerating GitHub projects content...');

		await fs.mkdir(ProjectGenerator.CONTENT_DIR, { recursive: true });

		let previousIndex = [];
		try {
			const rawIndex = await fs.readFile(ProjectGenerator.INDEX_PATH, 'utf-8');
			previousIndex = JSON.parse(rawIndex);
		} catch (error) {}

		const indexData = [];

		for (const repo of ProjectGenerator.REPOSITORIES) {
			try {
				Log.info(`Fetching data for ${repo}...`);

				const cachedEntry = previousIndex.find((entry) => {
					return entry.id === repo;
				});

				const data = await ProjectGenerator.#fetchRepoData(repo, cachedEntry);

				if (!data.skipWrite) {
					const mdPath = path.join(ProjectGenerator.CONTENT_DIR, `${repo}.md`);
					await fs.writeFile(mdPath, data.readme, 'utf-8');
					await ProjectGenerator.#generateStaticProjectHtml(data);
					Log.success(`Downloaded and saved README and Image for ${repo}`);
				} else {
					const mdPath = path.join(ProjectGenerator.CONTENT_DIR, `${repo}.md`);
					data.readme = await fs.readFile(mdPath, 'utf-8');

					await ProjectGenerator.#generateStaticProjectHtml(data);

					Log.info(`Skipped README download (no changes)`);
				}

				indexData.push({
					id: data.id,
					title: data.title,
					description: data.description,
					date: data.date,
					updatedAt: data.updatedAt,
					stars: data.stars,
					tech: data.tech,
					githubUrl: data.githubUrl || data.url,
					ogImage: data.ogImage,
					ogImageWidth: data.ogImageWidth,
					ogImageHeight: data.ogImageHeight,
				});
			} catch (error) {
				Log.error(`Error processing ${repo}: ${error.message}`);
			}
		}

		await fs.writeFile(
			ProjectGenerator.INDEX_PATH,
			JSON.stringify(indexData, null, '\t'),
			'utf-8'
		);
		Log.success(`Generated ${ProjectGenerator.INDEX_PATH} with ${indexData.length} entries.`);
	}
}

ProjectGenerator.run();
