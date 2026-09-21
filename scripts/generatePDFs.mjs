import fs from 'fs/promises';
import { marked } from 'marked';
import * as markedAlertModule from 'marked-alert';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import * as markedResponsiveImagesModule from 'marked-responsive-images';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';

import { injectIntoMain } from './buildUtils.mjs';
import { Log } from './logger.mjs';

/**
 * Generates PDF files from markdown files located in the print directory.
 * Configures marked.js natively to avoid loading unused frontend application logic into Node,
 * and scrambles contact info against PDF scrapers using DOM fragmentation and zero-width characters.
 */
class PdfGenerator {
	/**
	 * @returns {string} The base directory for print files.
	 * @constant
	 */
	static get PRINT_DIR() {
		return path.resolve('public/print');
	}

	/**
	 * @returns {string} The output directory for PDF files.
	 * @constant
	 */
	static get OUTPUT_DIR() {
		return path.resolve('public');
	}

	/**
	 * @returns {string} The path to the HTML template used for PDF generation.
	 * @constant
	 */
	static get TEMPLATE_PATH() {
		return path.resolve('public/print/cv-template.html');
	}

	/**
	 * Decodes obfuscated payloads, parses HTML entities into raw characters, and injects the epoch token.
	 * @param {string} encodedText - The obfuscated Base64/ROT13 payload.
	 * @param {Object} ObfuscatorClass - The frontend Obfuscator class imported via SSR.
	 * @returns {string} The fully decoded, plain-text string.
	 * @private
	 */
	static #decodeEntitiesAndEpoch(encodedText, ObfuscatorClass) {
		let decoded = ObfuscatorClass.deobfuscate(encodedText);

		decoded = decoded
			.replace(/&#(\d+);/g, (match, dec) => {
				return String.fromCharCode(dec);
			})
			.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
				return String.fromCharCode(parseInt(hex, 16));
			});

		if (decoded.includes(ObfuscatorClass.EPOCH_TOKEN)) {
			decoded = decoded.split(ObfuscatorClass.EPOCH_TOKEN).join(Date.now().toString(36));
		}

		return decoded;
	}

	/**
	 * Scrambles text by injecting zero-width characters and fragmenting the string
	 * into randomized inline DOM elements. This prevents scrapers from reading a continuous string.
	 * @param {string} text - The text to scramble.
	 * @returns {string} The scrambled HTML string.
	 * @private
	 */
	static #scrambleTextForPdf(text) {
		const wrappers = [
			(chunk) => {
				return `<span>${chunk}</span>`;
			},
			(chunk) => {
				return `<i class="obf-part">${chunk}</i>`;
			},
			(chunk) => {
				return `<em class="obf-part">${chunk}</em>`;
			},
			(chunk) => {
				return `<b class="obf-part">${chunk}</b>`;
			},
			(chunk) => {
				return `<strong class="obf-part">${chunk}</strong>`;
			},
		];

		let scrambledHtml = '';
		let currentIndex = 0;

		while (currentIndex < text.length) {
			const chunkSize = Math.floor(Math.random() * 5) + 1;
			const chunk = text.substring(currentIndex, currentIndex + chunkSize);
			const spacedChunk = chunk.split('').join('\u200B\u200C\u200D');
			const randomWrapper = wrappers[Math.floor(Math.random() * wrappers.length)];

			scrambledHtml += randomWrapper(spacedChunk);
			currentIndex += chunkSize;
		}

		return `<span class="protected-contact">${scrambledHtml}</span>`;
	}

	/**
	 * Instantiates the necessary marked extensions directly, and overrides
	 * specific renderers to apply text scrambling for PDF-level obfuscation.
	 * @param {Object} Obfuscator - The frontend Obfuscator class.
	 * @private
	 */
	static #setupMarkedForPdf(Obfuscator) {
		marked.use(gfmHeadingId({ prefix: '_' }));

		const markedAlert = markedAlertModule.default || markedAlertModule.markedAlert;
		marked.use(
			markedAlert({
				variants: [
					{
						type: 'info',
						title: 'Info',
						icon: '<svg class="octicon octicon-info mr-2" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>',
					},
					{
						type: 'attention',
						title: 'Attention',
						icon: '<svg class="octicon octicon-alert mr-2" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
					},
					{
						type: 'astuce',
						title: 'Astuce',
						icon: '<svg class="octicon octicon-light-bulb mr-2" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg>',
					},
					{
						type: 'avertissement',
						title: 'Avertissement',
						icon: '<svg class="octicon octicon-stop mr-2" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>',
					},
					{ type: 'summary', title: 'Summary', icon: '' },
					{ type: 'résumé', title: 'Résumé', icon: '' },
				],
			})
		);

		const markedResponsiveImages =
			markedResponsiveImagesModule.default
			|| markedResponsiveImagesModule.markedResponsiveImages;
		marked.use(
			markedResponsiveImages({
				debug: false,
				sizes: '(max-width: 820px) 95vw, 820px',
				class: 'md-img',
				decoding: 'async',
				lazyLoadThreshold: '700',
			})
		);

		marked.use({
			extensions: [
				{
					name: 'obfuscator',
					level: 'inline',
					start(src) {
						return src.match(/(?:&#8203;|\u200B)/)?.index;
					},
					tokenizer(src) {
						const rule = /^(?:&#8203;|\u200B)(.*?)(?:&#8203;|\u200B)/;
						const match = rule.exec(src);

						if (match) {
							return {
								type: 'obfuscator',
								raw: match[0],
								text: match[1],
							};
						}
					},
					renderer(token) {
						const cleanText = token.text.trim();
						const decodedText = PdfGenerator.#decodeEntitiesAndEpoch(
							cleanText,
							Obfuscator
						);

						return PdfGenerator.#scrambleTextForPdf(decodedText);
					},
				},
			],
			renderer: {
				link(token) {
					const { href, text } = token;

					if (href) {
						if (href.startsWith('mailto:') || href.startsWith('tel:')) {
							const cleanText = text.replace(/<[^>]*>?/gm, '');
							const decodedText = PdfGenerator.#decodeEntitiesAndEpoch(
								cleanText,
								Obfuscator
							);

							return PdfGenerator.#scrambleTextForPdf(decodedText);
						}
					}

					return false;
				},
			},
		});
	}

	/**
	 * Generates the header template for the PDF.
	 * @param {string} lang - The language code (e.g., 'en_US').
	 * @returns {string} The HTML string for the header.
	 * @private
	 */
	static #getHeaderTemplate(lang) {
		const title =
			lang === 'fr_FR' ? 'Eric Lowry — Curriculum Vitae' : 'Eric Lowry — Curriculum Vitae';
		return `
			<div style="font-size: 8pt; font-family: sans-serif; width: 100%; text-align: right; padding-right: 15mm; color: #777;">
				${title}
			</div>
		`;
	}

	/**
	 * Generates the footer template for the PDF.
	 * @param {string} lang - The language code (e.g., 'en_US').
	 * @returns {string} The HTML string for the footer.
	 * @private
	 */
	static #getFooterTemplate(lang) {
		const pageText = lang === 'fr_FR' ? 'Page' : 'Page';
		const ofText = lang === 'fr_FR' ? 'sur' : 'of';
		return `
			<div style="font-size: 8pt; font-family: sans-serif; width: 100%; text-align: center; color: #777;">
				${pageText} <span class="pageNumber"></span> ${ofText} <span class="totalPages"></span>
			</div>
		`;
	}

	/**
	 * Processes a specific markdown file and exports it to PDF.
	 * @param {string} lang - The language code.
	 * @param {string} filename - The markdown filename.
	 * @param {string} baseHtml - The raw HTML template string.
	 * @param {import('puppeteer-core').Browser} browser - The active Puppeteer browser instance.
	 * @returns {Promise<void>}
	 * @private
	 */
	static async #processFile(lang, filename, baseHtml, browser) {
		const mdPath = path.join(PdfGenerator.PRINT_DIR, lang, filename);
		const rawMd = await fs.readFile(mdPath, 'utf-8');
		const htmlContent = marked.parse(rawMd);
		const finalHtml = injectIntoMain(baseHtml, htmlContent);

		const tempPath = path.join(PdfGenerator.PRINT_DIR, 'temp_print.html');
		await fs.writeFile(tempPath, finalHtml, 'utf-8');

		const page = await browser.newPage();

		await page.goto('http://localhost:5174/print/temp_print.html', {
			waitUntil: 'networkidle0',
		});

		const pdfFilename = filename.replace('.md', `-${lang}.pdf`);
		const pdfPath = path.join(PdfGenerator.OUTPUT_DIR, pdfFilename);

		await page.pdf({
			path: pdfPath,
			format: 'A4',
			tagged: true,
			printBackground: true,
			margin: {
				top: '20mm',
				bottom: '20mm',
				left: '15mm',
				right: '15mm',
			},
			displayHeaderFooter: true,
			headerTemplate: PdfGenerator.#getHeaderTemplate(lang),
			footerTemplate: PdfGenerator.#getFooterTemplate(lang),
		});

		await page.close();
		await fs.unlink(tempPath);
		Log.success(`Generated PDF: ${lang}/${pdfFilename}`);
	}

	/**
	 * Executes the PDF generation sequence across all localized print directories.
	 * @returns {Promise<void>}
	 */
	static async run() {
		Log.info('\nStarting local Vite server for PDF rendering...');

		const vite = await createServer({
			server: { port: 5174 },
			configFile: path.resolve('vite.config.js'),
		});
		await vite.listen();

		let baseHtml;
		try {
			baseHtml = await fs.readFile(PdfGenerator.TEMPLATE_PATH, 'utf-8');
		} catch (error) {
			Log.error(`Template not found at ${PdfGenerator.TEMPLATE_PATH}`);
			await vite.close();
			return;
		}

		let browser;
		try {
			browser = await puppeteer.launch({
				channel: 'chrome',
				headless: true,
			});
		} catch (error) {
			Log.error(
				`Could not launch local browser. Ensure Google Chrome is installed. ${error.message}`
			);
			await vite.close();
			return;
		}

		try {
			const { Obfuscator } = await vite.ssrLoadModule(
				'/src/js/modules/markdown/obfuscator.js'
			);

			PdfGenerator.#setupMarkedForPdf(Obfuscator);

			const items = await fs.readdir(PdfGenerator.PRINT_DIR, { withFileTypes: true });
			const langFolders = items.filter((item) => {
				return item.isDirectory();
			});

			for (const folder of langFolders) {
				const lang = folder.name;
				const langPath = path.join(PdfGenerator.PRINT_DIR, lang);
				const files = await fs.readdir(langPath);

				const mdFiles = files.filter((file) => {
					return file.endsWith('.md');
				});

				for (const mdFile of mdFiles) {
					await PdfGenerator.#processFile(lang, mdFile, baseHtml, browser);
				}
			}
		} catch (error) {
			Log.error(`PDF generation failed: ${error.message}`);
		} finally {
			if (browser) {
				await browser.close();
			}
			await vite.close();
		}
	}
}

PdfGenerator.run();
