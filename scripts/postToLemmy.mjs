import fs from 'fs';
import { stdin as input, stdout as output } from 'process';
import * as readline from 'readline/promises';

import { Log } from './logger.mjs';

/**
 * Handles the interactive synchronization of blog posts to Lemmy communities.
 */
class LemmySynchronizer {
	/**
	 * @type {readline.Interface|null}
	 * @private
	 */
	#readlineInterface = null;

	/**
	 * @type {boolean}
	 * @private
	 */
	#isDryRun = false;

	/**
	 * Initializes the LemmySynchronizer.
	 */
	constructor() {
		this.#readlineInterface = readline.createInterface({ input, output });
		this.#isDryRun = process.argv.includes('--dry-run');
	}

	/**
	 * @constant
	 * @returns {string} The path to the blog index JSON file.
	 */
	static get BLOG_INDEX_FILE() {
		return 'public/content/blog-index.json';
	}

	/**
	 * @constant
	 * @returns {string} The path to the sync history file.
	 */
	static get HISTORY_FILE() {
		return 'lemmy-history.json';
	}

	/**
	 * @constant
	 * @returns {string} The website's production base URL.
	 */
	static get BASE_URL() {
		return 'https://eric-lowry.com';
	}

	/**
	 * @constant
	 * @returns {string} The API endpoint URL to create a post on Lemmy.
	 */
	static get LEMMY_API_URL() {
		return 'https://lemmy.zip/api/v3/post';
	}

	/**
	 * @constant
	 * @returns {Object<string, Array<{name: string, id: number}>>} Configured Lemmy community mappings grouped by language code.
	 */
	static get COMMUNITIES() {
		return {
			en_US: [
				{ name: 'blogging@programming.dev', id: 268897 },
				{ name: 'blogs@lemmy.ml', id: 963583 },
				{ name: 'webdev@programming.dev', id: 2714 },
				{ name: 'webdev@lemmy.world', id: 1019480 },
				{ name: 'programming@beehaw.org', id: 52 },
				{ name: 'technology@beehaw.org', id: 14 },
				{ name: 'frontend@lemmy.ml', id: 30333 },
				{ name: 'javascript@programming.dev', id: 4799 },
				{ name: 'javascript@lemmy.ml', id: 12702 },
				{ name: 'markdown@lemmy.ca', id: 396962 },
				{ name: 'markdown@piefed.social', id: 1845477 },
				{ name: 'css@programming.dev', id: 4804 },
				{ name: 'css@css@lemmy.ml', id: 1030061 },
				{ name: 'obsidian@sh.itjust.works', id: 23337 },
				{ name: 'obsidianmd@lemmy.world', id: 570 },
				{ name: 'opensource@programming.dev', id: 190437 },
				{ name: 'opensourcegames@lemmy.ml', id: 14192 },
				{ name: 'opensource@lemmy.ml', id: 19 },
				{ name: 'foss@beehaw.org', id: 8 },
				{ name: 'foss_gaming@lemmy.world', id: 1762 },
				{ name: 'gamedev@programming.dev', id: 4449 },
				{ name: 'gamedev@lemmy.blahaj.zone', id: 3038 },
				{ name: 'gamedev@lemmy.ml', id: 36172 },
				{ name: 'tabletop@beehaw.org', id: 23227 },
			],
			fr_FR: [
				{ name: 'technologie@jlai.lu', id: 70243 },
				{ name: 'opensource@jlai.lu', id: 191103 },
				{ name: 'forumlibre@jlai.lu', id: 108354 },
				{ name: 'france@jlai.lu', id: 6678 },
				{ name: 'interessant@jlai.lu', id: 437540 },
			],
		};
	}

	/**
	 * Initializes and runs the interactive synchronization process.
	 * @returns {Promise<void>}
	 */
	async init() {
		try {
			if (this.#isDryRun) {
				Log.info(
					'\n=================================================\n DRY RUN MODE ACTIVATED - NO DATA WILL BE SAVED\n================================================='
				);
			}

			if (!process.env.LEMMY_JWT) {
				Log.error('Error: LEMMY_JWT environment variable is missing.');
				return;
			}

			const history = this.#loadHistory();

			if (!fs.existsSync(LemmySynchronizer.BLOG_INDEX_FILE)) {
				Log.error('Error: Blog index not found. Run generateBlog.mjs first.');
				return;
			}

			const allPosts = JSON.parse(
				fs.readFileSync(LemmySynchronizer.BLOG_INDEX_FILE, 'utf-8')
			);
			const newPosts = allPosts.filter((post) => {
				return !history.includes(post.date);
			});

			if (newPosts.length === 0) {
				Log.info('\nNo new posts to sync to Lemmy.\n');
				this.#readlineInterface.close();
				return;
			}

			for (const post of newPosts) {
				await this.#processPost(post, history);
			}

			this.#readlineInterface.close();
			Log.success('\nSynchronization session complete.\n');
		} finally {
			// This guarantees readline closes, preventing the Windows crash
			this.#readlineInterface.close();
		}
	}

	/**
	 * Processes a single post for interactive terminal posting.
	 * @param {Object} post The blog post object containing title, date, and language.
	 * @param {Array<string>} history The history array of previously posted dates.
	 * @returns {Promise<void>}
	 * @private
	 */
	async #processPost(post, history) {
		const availableCommunities = LemmySynchronizer.COMMUNITIES[post.language];

		Log.info(
			`\n==================================================\nNEW POST: ${post.title}\nLanguage: ${post.language}\n==================================================`
		);

		if (!availableCommunities || availableCommunities.length === 0) {
			console.log(`No communities configured for language '${post.language}'. Skipping.`);
			return;
		}

		availableCommunities.forEach((community, index) => {
			console.log(`${index + 1}. ${community.name}`);
		});
		Log.info('0. Skip this post completely');

		const primaryInput = await this.#readlineInterface.question(
			`\nSelect PRIMARY community (0-${availableCommunities.length}): `
		);
		const primaryIndex = parseInt(primaryInput, 10) - 1;

		if (
			primaryInput === '0'
			|| isNaN(primaryIndex)
			|| primaryIndex < 0
			|| primaryIndex >= availableCommunities.length
		) {
			Log.info('Skipping post...');
			return;
		}

		const primaryCommunity = availableCommunities[primaryIndex];
		const crossInput = await this.#readlineInterface.question(
			'Select CROSSPOST communities (comma-separated e.g., 1,3 or press Enter for none): '
		);

		const crossCommunities = crossInput
			.split(',')
			.map((string) => {
				return parseInt(string.trim(), 10) - 1;
			})
			.filter((index) => {
				return (
					!isNaN(index)
					&& index >= 0
					&& index < availableCommunities.length
					&& index !== primaryIndex
				);
			})
			.map((index) => {
				return availableCommunities[index];
			});

		const customBody = await this.#readMultiLine(
			'\nEnter a summary for this Lemmy post (write/paste markdown text, then type EOF on a new line and press Enter to submit): '
		);

		const postUrl = `${LemmySynchronizer.BASE_URL}/blog/${post.date}`;
		const customThumbnail = `${LemmySynchronizer.BASE_URL}/assets/images/blog/${post.date.replace(/-/g, '')}/poster.png`;

		const languageId = await this.#getLanguageId(post.language);

		try {
			Log.info(`\nPosting to primary: ${primaryCommunity.name}...`);
			await this.#postToCommunity(
				primaryCommunity.id,
				post.title,
				postUrl,
				customBody,
				languageId,
				customThumbnail
			);
			Log.success('Success!');

			for (const crossCommunity of crossCommunities) {
				Log.info('Waiting 3 seconds to avoid rate limits...');
				await this.#sleep(3000);

				Log.info(`Crossposting to: ${crossCommunity.name}...`);
				await this.#postToCommunity(
					crossCommunity.id,
					post.title,
					postUrl,
					customBody,
					languageId,
					customThumbnail
				);
				Log.success('Success!');
			}

			history.push(post.date);
			this.#saveHistory(history);
		} catch (error) {
			Log.error(`Failed to post ${post.title}:`, error.message);
			console.log('Stopping synchronization to prevent duplicate errors.');
			throw error;
		}
	}

	/**
	 * Fetches the correct language ID from the Lemmy instance based on the post language code.
	 * @param {string} langCode The blog language code (e.g., 'en_US', 'fr_FR').
	 * @returns {Promise<number|null>} The Lemmy language integer ID, or null if not found.
	 * @private
	 */
	async #getLanguageId(langCode) {
		// Lemmy uses short codes like 'en' or 'fr', so we strip the country code ('_US')
		const shortCode = langCode.split('_')[0];

		try {
			const response = await fetch('https://lemmy.zip/api/v3/site');
			const data = await response.json();

			// Search the API response for the matching language code
			const langMatch = data.all_languages.find((lang) => lang.code === shortCode);

			return langMatch ? langMatch.id : null;
		} catch (error) {
			Log.warn(`\nWarning: Could not fetch language ID for ${shortCode}:`, error.message);
			return null;
		}
	}

	/**
	 * Reads multi-line input from the terminal until an empty line is entered.
	 * @param {string} promptText The text to display to the user.
	 * @returns {Promise<string>} The multi-line user input value.
	 * @private
	 */
	#readMultiLine(promptText) {
		return new Promise((resolve) => {
			console.log(promptText);
			let lines = [];

			const onLine = (line) => {
				// Stop listening only when the user types EOF on a new line
				if (line.trim() === 'EOF') {
					this.#readlineInterface.removeListener('line', onLine);
					resolve(lines.join('\n'));
				} else {
					lines.push(line);
				}
			};

			this.#readlineInterface.on('line', onLine);
		});
	}

	/**
	 * Loads the history file if it currently exists on the file system.
	 * @returns {Array<string>} An array of dates that have already been posted.
	 * @private
	 */
	#loadHistory() {
		if (fs.existsSync(LemmySynchronizer.HISTORY_FILE)) {
			return JSON.parse(fs.readFileSync(LemmySynchronizer.HISTORY_FILE, 'utf-8'));
		}

		return [];
	}

	/**
	 * Saves the history array safely back to the file system.
	 * @param {Array<string>} history The updated history array to save.
	 * @private
	 */
	#saveHistory(history) {
		if (this.#isDryRun) {
			Log.warn(
				`[DRY RUN] Skipped saving ${history.length} records to ${LemmySynchronizer.HISTORY_FILE}`
			);
			return;
		}

		fs.writeFileSync(LemmySynchronizer.HISTORY_FILE, JSON.stringify(history, null, 2));
	}

	/**
	 * Dispatches the HTTP POST request to the Lemmy API or logs it if in dry-run mode.
	 * @param {number} communityId - The target community integer ID.
	 * @param {string} title - The post title.
	 * @param {string} url - The URL of the blog post.
	 * @param {string} bodyText - The markdown body text for the post.
	 * @param {string} languageId - The language ID for the post.
	 * @param {string} customThumbnail - The URL for the custom thumbnail.
	 * @returns {Promise<Object>} The API response payload.
	 * @private
	 */
	async #postToCommunity(communityId, title, url, bodyText, languageId, customThumbnail) {
		const payload = {
			community_id: communityId,
			name: title,
			url: url,
		};

		if (bodyText && bodyText.trim() !== '') {
			payload.body = bodyText;
		}

		if (languageId !== null) {
			payload.language_id = languageId;
		}

		if (customThumbnail) {
			payload.custom_thumbnail = customThumbnail;
		}

		if (this.#isDryRun) {
			Log.info(`[DRY RUN] Would send POST to ${LemmySynchronizer.LEMMY_API_URL}`);
			Log.info(
				'[DRY RUN] Payload:',
				JSON.stringify({ ...payload, auth: '[REDACTED]' }, null, 2)
			);
			return { success: true, dryRun: true };
		}

		const response = await fetch(LemmySynchronizer.LEMMY_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.LEMMY_JWT}`,
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(JSON.stringify(errorData));
		}

		return response.json();
	}

	/**
	 * Pauses script execution for a specified duration to prevent API rate limiting.
	 * @param {number} milliseconds The time to sleep in milliseconds.
	 * @returns {Promise<void>}
	 * @private
	 */
	#sleep(milliseconds) {
		return new Promise((resolve) => {
			if (this.#isDryRun) {
				resolve();
				return;
			}
			setTimeout(resolve, milliseconds);
		});
	}
}

const synchronizer = new LemmySynchronizer();
synchronizer.init().catch((error) => {
	Log.error('Fatal synchronization error:', error);
	process.exit(1);
});
