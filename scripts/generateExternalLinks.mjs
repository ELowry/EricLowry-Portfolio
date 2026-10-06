import { exec } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import util from 'util';

import { loadEnv } from './buildUtils.mjs';
import { Log } from './logger.mjs';

const execAsync = util.promisify(exec);

/**
 * Generates external links index and caches Open Graph metadata and images.
 */
class ExternalLinksGenerator {
	/**
	 * @returns {number} The maximum number of concurrent requests.
	 * @constant
	 */
	static get CONCURRENCY_LIMIT() {
		return 8;
	}

	/**
	 * @returns {number} The timeout in milliseconds for network requests.
	 * @constant
	 */
	static get FETCH_TIMEOUT_MS() {
		return 10000;
	}

	/**
	 * @returns {number} The delay in milliseconds between API requests to prevent secondary rate limiting.
	 * @constant
	 */
	static get API_DELAY_MS() {
		return 300;
	}

	/**
	 * @returns {string} The target directory for scanning markdown files.
	 * @constant
	 */
	static get CONTENT_DIR() {
		return 'public/content';
	}

	/**
	 * @returns {string} The target path for the JSON index.
	 * @constant
	 */
	static get OUTPUT_JSON() {
		return 'public/assets/external-links.json';
	}

	/**
	 * @returns {string} The base directory for generated images.
	 * @constant
	 */
	static get IMAGE_DIR() {
		return 'public/assets/images/external-links';
	}

	/**
	 * @returns {string} The default User-Agent for network requests.
	 * @constant
	 */
	static get USER_AGENT() {
		return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0';
	}

	/**
	 * @returns {Array<string>} The list of domains to ignore when resolving external links.
	 * @constant
	 */
	static get IGNORED_DOMAINS() {
		return [
			'eric-lowry.com',
			'localhost',
			'127.0.0.1',
			'web.archive.org',
			'spectra.video',
			'developer.android.com',
		];
	}

	/**
	 * @returns {Array<string>} The list of file extensions to ignore when resolving links.
	 * @constant
	 */
	static get IGNORED_EXTENSIONS() {
		return [
			'.jpg',
			'.jpeg',
			'.png',
			'.gif',
			'.webp',
			'.svg',
			'.mp4',
			'.webm',
			'.pdf',
			'.zip',
			'.exe',
		];
	}

	/**
	 * Recursively fetches all markdown files in a directory.
	 * @param {string} dir - The directory path to search.
	 * @returns {string[]} An array of absolute file paths to all `.md` files found.
	 * @private
	 */
	static #getMarkdownFiles(dir) {
		let results = [];
		const list = fs.readdirSync(dir);
		for (const file of list) {
			const filePath = path.join(dir, file);
			const stat = fs.statSync(filePath);
			if (stat.isDirectory()) {
				results = results.concat(ExternalLinksGenerator.#getMarkdownFiles(filePath));
			} else if (filePath.endsWith('.md')) {
				results.push(filePath);
			}
		}
		return results;
	}

	/**
	 * Extracts all remote HTTP/HTTPS links from a markdown string.
	 * @param {string} markdown - The raw markdown content to scan.
	 * @returns {string[]} An array of unique HTTP/HTTPS URLs found in the content.
	 * @private
	 */
	static #extractLinks(markdown) {
		const links = new Set();
		const mdRegex = /(?<!!)\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;
		const htmlRegex = /href="(https?:\/\/[^"]+)"/g;

		let match;
		while ((match = mdRegex.exec(markdown)) !== null) {
			links.add(match[1]);
		}
		while ((match = htmlRegex.exec(markdown)) !== null) {
			links.add(match[1]);
		}

		return Array.from(links);
	}

	/**
	 * Decodes basic HTML entities.
	 * @param {string} str - The string containing HTML entities to decode.
	 * @returns {string} The decoded string.
	 * @private
	 */
	static #decodeHtml(str) {
		return str
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'");
	}

	/**
	 * Parses HTML via Regex to extract specific OpenGraph content safely without catastrophic backtracking.
	 * @param {string} html - The raw HTML string of the fetched page.
	 * @returns {Object} The extracted OpenGraph metadata.
	 * @private
	 */
	static #extractOgData(html) {
		const getAttr = (regexes) => {
			for (const r of regexes) {
				const match = html.match(r);
				if (match) {
					const content =
						match[1] !== undefined
							? match[1]
							: match[2] !== undefined
								? match[2]
								: match[3];
					if (content) {
						return ExternalLinksGenerator.#decodeHtml(content.trim());
					}
				}
			}
			return null;
		};

		const title = getAttr([
			/<meta[^>]+property=["']og:title["'][^>]+content=(?:"([^"]*)"|'([^']*)')/i,
			/<meta[^>]+content=(?:"([^"]*)"|'([^']*)')[^>]+property=["']og:title["']/i,
			/<title[^>]*>([^<]*)<\/title>/i,
		]);

		const description = getAttr([
			/<meta[^>]+property=["']og:description["'][^>]+content=(?:"([^"]*)"|'([^']*)')/i,
			/<meta[^>]+content=(?:"([^"]*)"|'([^']*)')[^>]+property=["']og:description["']/i,
			/<meta[^>]+name=["']description["'][^>]+content=(?:"([^"]*)"|'([^']*)')/i,
			/<meta[^>]+content=(?:"([^"]*)"|'([^']*)')[^>]+name=["']description["']/i,
		]);

		const siteName = getAttr([
			/<meta[^>]+property=["']og:site_name["'][^>]+content=(?:"([^"]*)"|'([^']*)')/i,
			/<meta[^>]+content=(?:"([^"]*)"|'([^']*)')[^>]+property=["']og:site_name["']/i,
		]);

		const imageAltRaw = getAttr([
			/<meta[^>]+property=["']og:image:alt["'][^>]+content=(?:"([^"]*)"|'([^']*)')/i,
			/<meta[^>]+content=(?:"([^"]*)"|'([^']*)')[^>]+property=["']og:image:alt["']/i,
		]);

		const imageNodes = [];
		const imgRegex1 =
			/<meta[^>]+property=["']og:image["'][^>]+content=(?:"([^"]*)"|'([^']*)')/gi;
		const imgRegex2 =
			/<meta[^>]+content=(?:"([^"]*)"|'([^']*)')[^>]+property=["']og:image["']/gi;

		let match;
		while ((match = imgRegex1.exec(html)) !== null) {
			imageNodes.push(
				ExternalLinksGenerator.#decodeHtml((match[1] || match[2] || '').trim())
			);
		}
		while ((match = imgRegex2.exec(html)) !== null) {
			imageNodes.push(
				ExternalLinksGenerator.#decodeHtml((match[1] || match[2] || '').trim())
			);
		}

		return { title, description, siteName, imageAltRaw, imageNodes };
	}

	/**
	 * Fetches package metadata from the NPM registry.
	 * @param {string} packageName - The NPM package name.
	 * @param {Object} headers - HTTP request headers.
	 * @returns {Promise<Object>} The package metadata.
	 * @private
	 */
	static async #fetchNpmData(packageName, headers) {
		const response = await fetch(`https://registry.npmjs.org/${packageName}`, {
			headers,
			signal: AbortSignal.timeout(ExternalLinksGenerator.FETCH_TIMEOUT_MS),
		});

		if (response.status === 304) {
			return { notModified: true };
		}
		if (!response.ok) {
			throw new Error(`NPM API HTTP ${response.status}`);
		}

		const pkgData = await response.json();
		return {
			title: pkgData.name,
			description: pkgData.description,
			siteName: 'NPM',
			imageAltRaw: `NPM Package: ${pkgData.name}`,
			imageNodes: [],
			responseEtag: response.headers.get('etag'),
			responseLastModified: response.headers.get('last-modified'),
		};
	}

	/**
	 * Fetches specific repository, file, issue, or PR metadata natively from the GitHub API.
	 * @param {URL} parsedUrl - The parsed GitHub URL.
	 * @param {Object} baseHeaders - HTTP request headers.
	 * @returns {Promise<Object|null>} The cleanly formatted metadata, or null if the API request fails.
	 * @private
	 */
	static async #fetchGithubData(parsedUrl, baseHeaders) {
		try {
			const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
			const owner = pathSegments[0];
			const repo = pathSegments[1];
			const type = pathSegments[2];
			const typeId = pathSegments[3];

			const headers = { ...baseHeaders };
			delete headers['If-None-Match'];
			delete headers['If-Modified-Since'];
			headers['Accept'] = 'application/vnd.github.v3+json';

			if (process.env.GITHUB_BASIC_TOKEN) {
				headers['Authorization'] = `Bearer ${process.env.GITHUB_BASIC_TOKEN}`;
			}

			let responseEtag = null;
			let responseLastModified = null;

			// Handle User Profiles (e.g. github.com/ELowry)
			if (!repo) {
				const userRes = await fetch(`https://api.github.com/users/${owner}`, {
					headers,
					signal: AbortSignal.timeout(ExternalLinksGenerator.FETCH_TIMEOUT_MS),
				});

				if (userRes.status === 304) {
					return { notModified: true };
				}
				if (!userRes.ok) {
					return null;
				}

				const userData = await userRes.json();
				const name = userData.name ? `${userData.name} (${owner})` : owner;

				return {
					title: `GitHub Profile: ${name}`,
					description:
						userData.bio || `View ${name}'s repositories and activity on GitHub.`,
					siteName: 'GitHub',
					imageAltRaw: `GitHub Profile: ${owner}`,
					imageNodes: [
						userData.avatar_url || `https://opengraph.githubassets.com/1/${owner}`,
					],
					responseEtag: userRes.headers.get('etag'),
					responseLastModified: userRes.headers.get('last-modified'),
				};
			}

			let title = `${owner}/${repo}`;
			let description = '';
			let imageAltRaw = `GitHub Repository: ${owner}/${repo}`;
			let siteName = 'GitHub';

			const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
				headers,
				signal: AbortSignal.timeout(ExternalLinksGenerator.FETCH_TIMEOUT_MS),
			});

			if (repoRes.status === 304) {
				return { notModified: true };
			}

			if (repoRes.ok) {
				const repoData = await repoRes.json();
				title = repoData.full_name || title;
				imageAltRaw = `GitHub Repository: ${repoData.name}`;

				if (repoData.stargazers_count !== undefined) {
					const stars = `★ ${repoData.stargazers_count}`;
					description = repoData.description
						? `${repoData.description} | ${stars}`
						: stars;
				} else {
					description = repoData.description || '';
				}

				responseEtag = repoRes.headers.get('etag');
				responseLastModified = repoRes.headers.get('last-modified');
			} else {
				return null; // Trigger HTML fallback if API rate limited or unauthorized
			}

			if (type === 'blob' || type === 'tree') {
				const filePath = pathSegments.slice(4).join('/');
				const typeName = type === 'blob' ? 'File' : 'Folder';

				title = `${filePath} (${title})`;
				description = `${typeName} on branch ${typeId}. ${description}`;
				imageAltRaw = `GitHub ${typeName}: ${filePath}`;
			} else if (type === 'issues') {
				title = typeId === 'new' ? `New Issue (${title})` : `Issues (${title})`;
				if (typeId && !isNaN(typeId)) {
					title = `Issue #${typeId} (${title})`;
					try {
						const issueRes = await fetch(
							`https://api.github.com/repos/${owner}/${repo}/issues/${typeId}`,
							{
								headers,
								signal: AbortSignal.timeout(
									ExternalLinksGenerator.FETCH_TIMEOUT_MS
								),
							}
						);
						if (issueRes.ok) {
							const issueData = await issueRes.json();
							title = `Issue #${issueData.number}: ${issueData.title}`;
							const stateLabel = issueData.state === 'closed' ? 'Closed' : 'Open';
							description = `${stateLabel} issue in ${owner}/${repo}. ${description}`;
						}
					} catch (e) {
						// Suppress sub-fetch errors
					}
				}
				imageAltRaw = title;
			} else if (type === 'pull' || type === 'pulls') {
				title = `Pull Requests (${title})`;
				if (typeId && !isNaN(typeId)) {
					title = `PR #${typeId} (${title})`;
					try {
						const prRes = await fetch(
							`https://api.github.com/repos/${owner}/${repo}/pulls/${typeId}`,
							{
								headers,
								signal: AbortSignal.timeout(
									ExternalLinksGenerator.FETCH_TIMEOUT_MS
								),
							}
						);
						if (prRes.ok) {
							const prData = await prRes.json();
							title = `PR #${prData.number}: ${prData.title}`;
							const stateLabel = prData.state === 'closed' ? 'Closed' : 'Open';
							description = `${stateLabel} pull request in ${owner}/${repo}. ${description}`;
						}
					} catch (e) {
						// Suppress sub-fetch errors
					}
				}
				imageAltRaw = title;
			} else if (type === 'releases') {
				title = `Releases (${title})`;
				if (typeId) {
					title = `${typeId === 'latest' ? 'Latest Release' : 'Release ' + typeId} (${title})`;
				}
			} else if (type === 'discussions') {
				title = `Discussions (${title})`;
			}

			if (!description) {
				description = `View the ${owner}/${repo} repository on GitHub.`;
			}

			const ogImageUrl = `https://opengraph.githubassets.com/1${parsedUrl.pathname}`;

			return {
				title,
				description,
				siteName,
				imageAltRaw,
				imageNodes: [ogImageUrl],
				responseEtag,
				responseLastModified,
			};
		} catch (e) {
			Log.warn(`   -> GitHub API skipped for ${parsedUrl.pathname}: ${e.message}`);
			return null;
		}
	}

	/**
	 * Fetches and parses OpenGraph metadata from an HTML webpage.
	 * @param {string} url - The webpage URL.
	 * @param {Object} headers - HTTP request headers.
	 * @returns {Promise<Object>} The parsed webpage metadata.
	 * @private
	 */
	static async #fetchHtmlData(url, headers) {
		const response = await fetch(url, {
			headers,
			signal: AbortSignal.timeout(ExternalLinksGenerator.FETCH_TIMEOUT_MS),
		});

		if (response.status === 304) {
			return { notModified: true };
		}
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const html = await response.text();
		const extracted = ExternalLinksGenerator.#extractOgData(html);

		return {
			title: extracted.title,
			description: extracted.description,
			siteName: extracted.siteName,
			imageAltRaw: extracted.imageAltRaw,
			imageNodes: extracted.imageNodes,
			responseEtag: response.headers.get('etag'),
			responseLastModified: response.headers.get('last-modified'),
		};
	}

	/**
	 * Downloads candidate images and converts the first successful one via ImageMagick PowerShell script.
	 * @param {string[]} imageNodes - Array of image node URLs or relative paths.
	 * @param {string} url - The base page URL for resolving relative links.
	 * @param {Object} headers - HTTP request headers.
	 * @returns {Promise<string|null>} The relative local image path if successful, otherwise null.
	 * @private
	 */
	static async #processOgImage(imageNodes, url, headers) {
		if (!imageNodes || imageNodes.length === 0) {
			return null;
		}

		for (const node of imageNodes) {
			if (!node) {
				continue;
			}
			const imgUrl = new URL(node, url).toString();

			try {
				const imgResponse = await fetch(imgUrl, {
					headers,
					signal: AbortSignal.timeout(ExternalLinksGenerator.FETCH_TIMEOUT_MS),
				});
				if (!imgResponse.ok) {
					continue;
				}

				const arrayBuffer = await imgResponse.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);

				const tempHash = crypto.randomBytes(8).toString('hex');
				const tempInputPath = path.join(
					ExternalLinksGenerator.IMAGE_DIR,
					`temp_og_${tempHash}.tmp`
				);
				try {
					fs.writeFileSync(tempInputPath, buffer);

					const imgHash = crypto.createHash('md5').update(imgUrl).digest('hex');
					const filename = `${imgHash}.jpg`;
					const finalOutputPath = path.join(ExternalLinksGenerator.IMAGE_DIR, filename);

					const psScript = path.join(process.cwd(), 'scripts', 'process-og-images.ps1');

					await execAsync(
						`powershell -ExecutionPolicy Bypass -File "${psScript}" -InputFile "${tempInputPath}" -OutputFile "${finalOutputPath}"`
					);

					return `/assets/images/external-links/${filename}`;
				} catch (imgError) {
					Log.warn(`    -> Skipping unsupported or broken image format: ${imgUrl}`);
				} finally {
					if (fs.existsSync(tempInputPath)) {
						fs.unlinkSync(tempInputPath);
					}
				}
			} catch (imgError) {
				Log.warn(`    -> Skipping unsupported or broken image format: ${imgUrl}`);
			}
		}

		return null;
	}

	/**
	 * Processes a single URL to extract and cache OG data.
	 * @param {string} url - The URL to process.
	 * @param {Object} linkCache - The global cache object.
	 * @returns {Promise<Object>} An object containing the result status.
	 * @private
	 */
	static async #processUrl(url, linkCache) {
		const cached = linkCache[url];
		let status = 'failed';

		try {
			const parsedUrl = new URL(url);
			const isNpm =
				parsedUrl.hostname.includes('npmjs.com')
				&& parsedUrl.pathname.startsWith('/package/');
			const isGithub = parsedUrl.hostname.includes('github.com');

			// Force refresh if cached title is dirty
			if (
				cached
				&& isGithub
				&& cached.title
				&& (cached.title.includes(' · ') || cached.title.startsWith('GitHub - '))
			) {
				delete cached.etag;
				delete cached.lastModified;
			}

			const headers = ExternalLinksGenerator.#buildHeaders(cached);
			const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

			let pageData = null;
			if (isNpm) {
				pageData = await ExternalLinksGenerator.#fetchNpmData(pathSegments[1], headers);
			} else if (isGithub && pathSegments.length >= 1) {
				await new Promise((resolve) =>
					setTimeout(resolve, ExternalLinksGenerator.API_DELAY_MS)
				);
				pageData = await ExternalLinksGenerator.#fetchGithubData(parsedUrl, headers);
			}

			if (!pageData) {
				pageData = await ExternalLinksGenerator.#fetchHtmlData(url, headers);
			}

			if (pageData.notModified) {
				return { status: 'skipped' };
			}

			let {
				title,
				description,
				siteName,
				imageAltRaw,
				imageNodes = [],
				responseEtag,
				responseLastModified,
			} = pageData;

			// HTML Fallback Cleanup
			if (!title) {
				title =
					parsedUrl.hostname.replace(/^www\./, '')
					+ (parsedUrl.pathname !== '/' ? parsedUrl.pathname : '');
			}

			if (siteName === 'GitHub' || (isGithub && !siteName)) {
				const repoMatch = parsedUrl.pathname.match(/^\/([^/]+\/[^/]+)/);
				const repoName = repoMatch ? repoMatch[1] : null;

				if (title) {
					if (title.includes(' at ')) {
						const parts = title.split(' · ');
						if (parts.length > 1) {
							const fileInfo = parts[0].split(' at ');
							title = `${fileInfo[0]} (${parts[1]})`;
						}
					} else if (title.includes('Issue #') || title.includes('Pull Request #')) {
						const parts = title.split(' · ');
						if (parts.length > 1) {
							title = `${parts[0]} (${parts[1]})`;
						}
					} else if (title.endsWith(' · GitHub')) {
						title = title.replace(' · GitHub', '');
					} else if (title.startsWith('GitHub - ')) {
						const parts = title.replace('GitHub - ', '').split(': ');
						title = parts[0];
						if (parts.length > 1 && (!description || description.trim() === '')) {
							description = parts.slice(1).join(': ');
						}
					}
				}

				if (description && repoName) {
					const suffix = ` - ${repoName}`;
					if (description.endsWith(suffix)) {
						description = description.slice(0, -suffix.length).trim();
					}
				}
			}

			const imageUrlsStr = imageNodes
				.map((imgUrl) => new URL(imgUrl, url).toString())
				.join('|');
			const finalImageAlt =
				imageAltRaw
				|| (siteName
					? `Preview image for ${siteName}`
					: `Preview image for ${title || 'external link'}`);

			const currentHash = ExternalLinksGenerator.#checkCacheValidity(
				cached,
				{ title, description, siteName },
				imageUrlsStr,
				finalImageAlt
			);

			if (currentHash === true) {
				cached.etag = responseEtag;
				cached.lastModified = responseLastModified;
				return { status: 'skipped' };
			}

			Log.info(`Processing metadata and image for: ${url}`);
			const localImagePath =
				(await ExternalLinksGenerator.#processOgImage(imageNodes, url, headers))
				|| cached?.image
				|| null;

			linkCache[url] = {
				title: title.trim(),
				description: description ? description.trim() : null,
				image: localImagePath,
				imageAlt: finalImageAlt.trim(),
				hash: currentHash,
				etag: responseEtag || null,
				lastModified: responseLastModified || null,
			};

			status = cached ? 'updated' : 'added';
		} catch (error) {
			Log.warn(`Failed to process ${url}: ${error.message}`);
			if (!cached || !cached.title) {
				const parsedUrl = new URL(url);
				linkCache[url] = {
					title:
						parsedUrl.hostname.replace(/^www\./, '')
						+ (parsedUrl.pathname !== '/' ? parsedUrl.pathname : ''),
					description: null,
					image: null,
					imageAlt: null,
					hash: null,
				};
				status = 'added';
			}
		}

		return { status };
	}

	/**
	 * Builds HTTP headers for link metadata requests.
	 * @param {Object|undefined} [cached=undefined] - The cached entry for the URL.
	 * @returns {Object} The HTTP headers object.
	 * @private
	 */
	static #buildHeaders(cached = undefined) {
		const headers = {
			'User-Agent': ExternalLinksGenerator.USER_AGENT,
			Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
			'Accept-Language': 'en-US,en;q=0.5',
		};

		if (cached?.etag) {
			headers['If-None-Match'] = cached.etag;
		}
		if (cached?.lastModified) {
			headers['If-Modified-Since'] = cached.lastModified;
		}

		return headers;
	}

	/**
	 * Checks if the current metadata matches the cached hash.
	 * @param {Object|undefined} cached - The cached entry.
	 * @param {Object} metadata - The new metadata.
	 * @param {string} imageUrlsStr - Joined string of candidate image URLs.
	 * @param {string} finalImageAlt - The resolved image alt text.
	 * @returns {string|boolean} The new hash if changed, otherwise true if valid.
	 * @private
	 */
	static #checkCacheValidity(cached, metadata, imageUrlsStr, finalImageAlt) {
		const { title, description, siteName } = metadata;
		const dataToHash = `${title || ''}|${description || ''}|${imageUrlsStr}|${finalImageAlt}|${siteName || ''}`;
		const currentHash = crypto.createHash('md5').update(dataToHash).digest('hex');

		if (cached && cached.hash === currentHash) {
			return true;
		}
		return currentHash;
	}

	/**
	 * Main execution function.
	 * @returns {Promise<void>}
	 */
	static async run() {
		console.log('\n');
		loadEnv();

		if (!fs.existsSync(ExternalLinksGenerator.IMAGE_DIR)) {
			fs.mkdirSync(ExternalLinksGenerator.IMAGE_DIR, { recursive: true });
		}

		let linkCache = {};
		if (fs.existsSync(ExternalLinksGenerator.OUTPUT_JSON)) {
			linkCache = JSON.parse(fs.readFileSync(ExternalLinksGenerator.OUTPUT_JSON, 'utf-8'));
		}

		const files = ExternalLinksGenerator.#getMarkdownFiles(ExternalLinksGenerator.CONTENT_DIR);
		const allUrls = new Set();

		files.forEach((file) => {
			const content = fs.readFileSync(file, 'utf-8');
			const links = ExternalLinksGenerator.#extractLinks(content);
			links.forEach((url) => {
				try {
					const parsed = new URL(url);
					const ext = path.extname(parsed.pathname).toLowerCase();

					if (
						!ExternalLinksGenerator.IGNORED_DOMAINS.includes(parsed.hostname)
						&& !ExternalLinksGenerator.IGNORED_EXTENSIONS.includes(ext)
						&& !parsed.pathname.includes('/embed/')
					) {
						parsed.hash = '';
						allUrls.add(parsed.toString());
					}
				} catch (e) {
					// Invalid URL, skip
				}
			});
		});

		for (const cachedUrl of Object.keys(linkCache)) {
			if (!allUrls.has(cachedUrl)) {
				delete linkCache[cachedUrl];
			}
		}

		Log.info(`Found ${allUrls.size} external links in content.`);

		let newCount = 0;
		let updateCount = 0;
		let skipCount = 0;

		const urlArray = Array.from(allUrls);
		const executing = new Set();

		for (const url of urlArray) {
			const promise = ExternalLinksGenerator.#processUrl(url, linkCache).then((res) => {
				executing.delete(promise);
				if (res.status === 'added') {
					newCount++;
				}
				if (res.status === 'updated') {
					updateCount++;
				}
				if (res.status === 'skipped') {
					skipCount++;
				}
			});

			executing.add(promise);

			if (executing.size >= ExternalLinksGenerator.CONCURRENCY_LIMIT) {
				await Promise.race(executing);
			}
		}

		await Promise.all(executing);

		const activeImagePaths = new Set();
		for (const key of Object.keys(linkCache)) {
			if (linkCache[key].image) {
				activeImagePaths.add(path.basename(linkCache[key].image));
			}
		}

		if (fs.existsSync(ExternalLinksGenerator.IMAGE_DIR)) {
			const imageFiles = fs.readdirSync(ExternalLinksGenerator.IMAGE_DIR);
			let deletedImages = 0;
			for (const file of imageFiles) {
				if (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.webp')) {
					if (!activeImagePaths.has(file)) {
						fs.unlinkSync(path.join(ExternalLinksGenerator.IMAGE_DIR, file));
						deletedImages++;
					}
				}
			}
			if (deletedImages > 0) {
				Log.info(`Cleaned up ${deletedImages} unused images from storage.`);
			}
		}

		fs.writeFileSync(ExternalLinksGenerator.OUTPUT_JSON, JSON.stringify(linkCache, null, 2));
		Log.success(
			`\nExternal Links Sync Complete:\n- Added: ${newCount}\n- Updated: ${updateCount}\n- Skipped (cached): ${skipCount}\n`
		);
	}
}

ExternalLinksGenerator.run();
