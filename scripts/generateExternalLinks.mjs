import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
const CONCURRENCY_LIMIT = 14;

const CONTENT_DIR = 'public/content';
const OUTPUT_JSON = 'public/assets/external-links.json';
const IMAGE_DIR = 'public/assets/images/external-links';
const IGNORED_DOMAINS = ['eric-lowry.com', 'localhost', '127.0.0.1', 'web.archive.org'];

/**
 * Simple logger using native ANSI color codes.
 */
const Log = {
	info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
	success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
	warn: (msg) => console.warn(`\x1b[33m${msg}\x1b[0m`),
};

/**
 * Recursively fetches all markdown files in a directory.
 * @param {string} dir - The directory path to search.
 * @returns {string[]} An array of absolute file paths to all `.md` files found.
 */
function getMarkdownFiles(dir) {
	let results = [];
	const list = fs.readdirSync(dir);
	for (const file of list) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			results = results.concat(getMarkdownFiles(filePath));
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
 */
function extractLinks(markdown) {
	const links = new Set();
	const mdRegex = /\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;
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
 */
function decodeHtml(str) {
	return str
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

/**
 * Parses HTML via Regex to extract specific OpenGraph content.
 * @param {string} html - The raw HTML string of the fetched page.
 * @returns {{title: string|null, description: string|null, siteName: string|null, imageAltRaw: string|null, imageNodes: string[]}} The extracted OpenGraph metadata.
 */
function extractOgData(html) {
	const getAttr = (regexes) => {
		for (const r of regexes) {
			const match = html.match(r);
			if (match) return decodeHtml(match[1].trim());
		}
		return null;
	};

	const title =
		getAttr([
			/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
			/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
		]) || getAttr([/<title[^>]*>([^<]+)<\/title>/i]);

	const description = getAttr([
		/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
		/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
		/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
		/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
	]);

	const siteName = getAttr([
		/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
		/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i,
	]);

	const imageAltRaw = getAttr([
		/<meta[^>]+property=["']og:image:alt["'][^>]+content=["']([^"']+)["']/i,
		/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:alt["']/i,
	]);

	// Extract all available og:image fallback tags
	const imageNodes = [];
	const imgRegex1 = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
	const imgRegex2 = /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi;

	let match;
	while ((match = imgRegex1.exec(html)) !== null) {
		imageNodes.push(decodeHtml(match[1]));
	}
	while ((match = imgRegex2.exec(html)) !== null) {
		imageNodes.push(decodeHtml(match[1]));
	}

	return { title, description, siteName, imageAltRaw, imageNodes };
}

/**
 * Main execution function
 */
async function generateExternalLinks() {
	console.log('\n');

	if (!fs.existsSync(IMAGE_DIR)) {
		fs.mkdirSync(IMAGE_DIR, { recursive: true });
	}

	let linkCache = {};
	if (fs.existsSync(OUTPUT_JSON)) {
		linkCache = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf-8'));
	}

	const files = getMarkdownFiles(CONTENT_DIR);
	const allUrls = new Set();

	// Extract unique URLs
	files.forEach((file) => {
		const content = fs.readFileSync(file, 'utf-8');
		const links = extractLinks(content);
		links.forEach((url) => {
			try {
				const parsed = new URL(url);
				if (!IGNORED_DOMAINS.includes(parsed.hostname)) {
					parsed.hash = '';
					allUrls.add(parsed.toString());
				}
			} catch (e) {
				// Invalid URL, skip
			}
		});
	});

	// Remove missing URLs from cache
	for (const cachedUrl of Object.keys(linkCache)) {
		if (!allUrls.has(cachedUrl)) {
			const imagePath = linkCache[cachedUrl].image;
			if (imagePath) {
				const fullPath = path.join(process.cwd(), 'public', imagePath);
				if (fs.existsSync(fullPath)) {
					fs.unlinkSync(fullPath);
				}
			}
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
		const promise = processUrl(url, linkCache).then((res) => {
			executing.delete(promise);
			if (res.status === 'added') newCount++;
			if (res.status === 'updated') updateCount++;
			if (res.status === 'skipped') skipCount++;
		});

		executing.add(promise);

		if (executing.size >= CONCURRENCY_LIMIT) {
			await Promise.race(executing);
		}
	}

	await Promise.all(executing);

	fs.writeFileSync(OUTPUT_JSON, JSON.stringify(linkCache, null, 2));
	Log.success(
		`\nExternal Links Sync Complete:\n- Added: ${newCount}\n- Updated: ${updateCount}\n- Skipped (cached): ${skipCount}\n`
	);
}

/**
 * Processes a single URL to extract and cache OG data.
 * @param {string} url - The URL to process.
 * @param {Object} linkCache - The global cache object.
 * @returns {Promise<Object>} An object containing the result status.
 */
async function processUrl(url, linkCache) {
	const cached = linkCache[url];
	let status = 'failed';

	try {
		const headers = {
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
			Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
			'Accept-Language': 'en-US,en;q=0.5',
		};

		if (cached?.etag) headers['If-None-Match'] = cached.etag;
		if (cached?.lastModified) headers['If-Modified-Since'] = cached.lastModified;

		const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });

		if (response.status === 304) {
			return { status: 'skipped' };
		}

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const html = await response.text();
		let { title, description, siteName, imageAltRaw, imageNodes } = extractOgData(html);

		if (siteName === 'GitHub' && title?.includes(': ')) {
			const parts = title.split(': ');
			title = parts[0].replace(/^GitHub\s*-\s*/i, '');
			description = parts.slice(1).join(': ');
			imageAltRaw = `GitHub Repository: ${title}`;
		}

		const imageUrlsStr = imageNodes.map((imgUrl) => new URL(imgUrl, url).toString()).join('|');

		let finalImageAlt = imageAltRaw;
		if (!finalImageAlt) {
			finalImageAlt = siteName
				? `Preview image for ${siteName}`
				: `Preview image for ${title || 'external link'}`;
		}

		const dataToHash = `${title || ''}|${description || ''}|${imageUrlsStr}|${finalImageAlt}|${siteName || ''}`;
		const currentHash = crypto.createHash('md5').update(dataToHash).digest('hex');

		if (cached && cached.hash === currentHash) {
			cached.etag = response.headers.get('etag');
			cached.lastModified = response.headers.get('last-modified');
			return { status: 'skipped' };
		}

		Log.info(`Processing metadata and image for: ${url}`);
		let localImagePath = cached?.image || null;

		if (imageNodes.length > 0) {
			for (const node of imageNodes) {
				if (!node) continue;
				const imgUrl = new URL(node, url).toString();

				try {
					const imgResponse = await fetch(imgUrl, {
						headers,
						signal: AbortSignal.timeout(10000),
					});
					if (!imgResponse.ok) {
						continue;
					}

					const arrayBuffer = await imgResponse.arrayBuffer();
					const buffer = Buffer.from(arrayBuffer);

					// Use a unique temp file name to avoid parallel collision
					const tempHash = crypto.randomBytes(8).toString('hex');
					const tempInputPath = path.join(IMAGE_DIR, `temp_og_${tempHash}.tmp`);
					try {
						fs.writeFileSync(tempInputPath, buffer);

						const imgHash = crypto.createHash('md5').update(imgUrl).digest('hex');
						const filename = `${imgHash}.jpg`;
						const finalOutputPath = path.join(IMAGE_DIR, filename);

						const psScript = path.join(
							process.cwd(),
							'scripts',
							'process-og-images.ps1'
						);

						await execAsync(
							`powershell -ExecutionPolicy Bypass -File "${psScript}" -InputFile "${tempInputPath}" -OutputFile "${finalOutputPath}"`
						);

						localImagePath = `/assets/images/external-links/${filename}`;
						break;
					} catch (imgError) {
						Log.warn(`    -> Skipping unsupported or broken image format: ${imgUrl}`);
					} finally {
						if (fs.existsSync(tempInputPath)) {
							fs.unlinkSync(tempInputPath);
						}
					}
					break;
				} catch (imgError) {
					Log.warn(`    -> Skipping unsupported or broken image format: ${imgUrl}`);
				}
			}
		}

		linkCache[url] = {
			title: title?.trim() || null,
			description: description?.trim() || null,
			image: localImagePath,
			imageAlt: finalImageAlt?.trim() || null,
			hash: currentHash,
			etag: response.headers.get('etag') || null,
			lastModified: response.headers.get('last-modified') || null,
		};

		status = cached ? 'updated' : 'added';
	} catch (error) {
		Log.warn(`Failed to process ${url}: ${error.message}`);
		if (!cached) {
			linkCache[url] = { title: null, description: null, image: null, hash: null };
		}
	}

	return { status };
}

generateExternalLinks();
