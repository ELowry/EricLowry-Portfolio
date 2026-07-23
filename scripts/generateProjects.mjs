import fs from 'fs/promises';
import path from 'path';

/**
 * Simple logger using native ANSI color codes.
 */
const Log = {
	info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
	success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
	warn: (msg) => console.warn(`\x1b[33m${msg}\x1b[0m`),
	error: (msg) => console.error(`\x1b[31m${msg}\x1b[0m`),
};

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
			try {
				await fs.access(mdPath);
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
		let ogImageUrl = '';
		if (htmlRes.ok) {
			const htmlText = await htmlRes.text();
			const match = htmlText.match(/<meta property="og:image" content="([^"]+)"/i);
			if (match) {
				ogImageUrl = match[1];
			}
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
			ogImage: ogImageUrl,
			skipWrite: false,
		};
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

		return processed;
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
				Log.info(`-> Fetching data for ${repo}...`);

				const cachedEntry = previousIndex.find((entry) => {
					return entry.id === repo;
				});

				const data = await ProjectGenerator.#fetchRepoData(repo, cachedEntry);

				if (!data.skipWrite) {
					const mdPath = path.join(ProjectGenerator.CONTENT_DIR, `${repo}.md`);
					await fs.writeFile(mdPath, data.readme, 'utf-8');
					Log.success(`   Downloaded and saved README for ${repo}`);
				} else {
					Log.info(`   Skipped README download (no changes)`);
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
