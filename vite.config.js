import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

// Generate a hash to use for cache busting
const timestamp = Date.now().toString();
const salt = crypto.randomBytes(16).toString('hex');
const buildHash = crypto
	.createHash('sha256')
	.update(timestamp + salt)
	.digest('hex');

/**
 * A simple Vite plugin to exclude specific folders from the final build output.
 * Since Vite's publicDir copy is all-or-nothing, this cleans up unwanted meta-folders.
 * @param {string[]} folders - Array of folder names to exclude from dist.
 * @returns {import('vite').Plugin} the vite plugin instance.
 */
function excludePublicFolders(folders) {
	return {
		name: 'exclude-public-folders',
		apply: 'build',
		closeBundle() {
			folders.forEach((folder) => {
				const fullPath = path.resolve('dist', folder);
				if (fs.existsSync(fullPath)) {
					fs.rmSync(fullPath, { recursive: true, force: true });
				}
			});
		},
	};
}

/**
 * A Vite plugin that watches public markdown files and triggers a full page reload on changes.
 * @returns {import('vite').Plugin} The Vite plugin instance.
 */
function watchPublicMarkdown() {
	return {
		name: 'watch-public-markdown',
		configureServer(server) {
			server.watcher.add(path.resolve('public/content'));
			server.watcher.on('change', (file) => {
				if (file.endsWith('.md')) {
					server.hot.send({
						type: 'full-reload',
						path: '*',
					});
				}
			});
		},
	};
}

/**
 * A simple Vite plugin to mimic Firebase hosting rewrites locally.
 * @returns {import('vite').Plugin} The Vite plugin instance.
 */
function firebaseRewritesPlugin() {
	return {
		name: 'firebase-rewrites',
		configureServer(server) {
			server.middlewares.use((request, response, next) => {
				if (request.url === '/rss' || request.url === '/feed') {
					request.url = '/feed-en_US.xml';
				} else if (request.url.startsWith('/content/') && !request.url.includes('.')) {
					request.url = '/content/404.json';
				} else if (request.url.startsWith('/lang/') && !request.url.includes('.')) {
					request.url = '/lang/langs.json';
				} else if (request.url.startsWith('/blog/') && !request.url.includes('.')) {
					request.url = `${request.url}/index.html`;
				}

				next();
			});
		},
	};
}

/**
 * A Vite plugin to fix the static HTML wrappers generated for Open Graph and SEO crawlers.
 * It recursively finds all generated index.html files in the build output.
 * It extracts the Open Graph meta blocks and statically injected <main> content,
 * then injects them into the final built `dist/index.html` (which has the correct hashed asset links).
 *
 * @returns {import('vite').Plugin} the vite plugin instance.
 */
function staticHtmlPlugin() {
	return {
		name: 'fix-static-html-og',
		apply: 'build',
		closeBundle() {
			const distDir = path.resolve('dist');
			const distIndexPath = path.join(distDir, 'index.html');
			const stagingDir = path.resolve('.static-html');

			if (!fs.existsSync(distIndexPath) || !fs.existsSync(stagingDir)) {
				return;
			}

			const dirsToCopy = ['blog', 'projects'];
			dirsToCopy.forEach((dir) => {
				const srcPath = path.join(stagingDir, dir);
				const destPath = path.join(distDir, dir);
				if (fs.existsSync(srcPath)) {
					fs.cpSync(srcPath, destPath, { recursive: true });
				}
			});

			const contentSrc = path.join(stagingDir, 'content');
			if (fs.existsSync(contentSrc)) {
				const modes = ['text', 'game'];
				modes.forEach((mode) => {
					const destPath = path.join(distDir, mode);
					fs.cpSync(contentSrc, destPath, { recursive: true });
				});
			}

			const distIndexHtml = fs.readFileSync(distIndexPath, 'utf-8');

			/**
			 * Recursively traverses a directory to find all nested `index.html` files, excluding the root index.
			 * @param {string} currentDir - The current directory path being scanned.
			 * @param {string[]} [fileList=[]] - The accumulated array of file paths (used during recursion).
			 * @returns {string[]} An array of absolute file paths pointing to `index.html` files.
			 */
			function walkDir(currentDir, fileList = []) {
				const files = fs.readdirSync(currentDir);
				for (const file of files) {
					const filePath = path.join(currentDir, file);
					if (fs.statSync(filePath).isDirectory()) {
						walkDir(filePath, fileList);
					} else if (file === 'index.html' && filePath !== distIndexPath) {
						fileList.push(filePath);
					}
				}
				return fileList;
			}

			const allIndexFiles = walkDir(distDir);

			allIndexFiles.forEach((postIndexPath) => {
				const rawPostHtml = fs.readFileSync(postIndexPath, 'utf-8');

				const ogMatch = rawPostHtml.match(
					/<!-- OG_META_START -->[\s\S]*?<!-- OG_META_END -->/
				);
				const mainMatch = rawPostHtml.match(/(<main[^!>]+>)[\s\S]*?(<\/main>)/);

				if (ogMatch) {
					let metaBlock = ogMatch[0];

					const relativePath = path.relative(distDir, postIndexPath);
					let mode = '';
					if (relativePath.startsWith(`text${path.sep}`)) {
						mode = 'text';
					} else if (relativePath.startsWith(`game${path.sep}`)) {
						mode = 'game';
					}

					if (mode) {
						metaBlock = metaBlock.replace(/__MODE__/g, mode);
					}

					let updatedHtml = distIndexHtml.replace(
						/<!-- OG_META_START -->[\s\S]*?<!-- OG_META_END -->/,
						() => {
							return metaBlock;
						}
					);

					if (mainMatch) {
						updatedHtml = updatedHtml.replace(
							/(<main[^!>]+>)[\s\S]*?(<\/main>)/,
							() => {
								return mainMatch[0];
							}
						);
					}

					fs.writeFileSync(postIndexPath, updatedHtml, 'utf-8');
				}
			});
		},
	};
}

/**
 * A Vite plugin to bypass Private Network Access (PNA) blocks for giscus.
 * This allows public iframes to fetch the giscus.css file during development.
 * @returns {import('vite').Plugin} the vite plugin instance.
 */
function allowPrivateNetworkAccess() {
	return {
		name: 'allow-pna',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const urlPath = req.url ? req.url.split('?')[0] : '';

				if (urlPath === '/src/css/giscus.css') {
					res.setHeader('Access-Control-Allow-Private-Network', 'true');
					res.setHeader('Access-Control-Allow-Origin', '*');

					if (req.method === 'OPTIONS') {
						res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
						res.setHeader('Access-Control-Allow-Headers', '*');
						res.end();
						return;
					}
				}
				next();
			});
		},
	};
}

/**
 * The main Vite configuration object.
 * Configures module aliases, custom build plugins, development server restrictions, and CSS transformation.
 * @param {Object} env - The Vite environment configuration object.
 * @param {string} env.mode - The current build mode (e.g., 'development' or 'production').
 * @returns {import('vite').UserConfig} The resolved Vite configuration.
 */
export default defineConfig(({ mode }) => {
	return {
		resolve: {
			preserveSymlinks: true,
			alias: {
				$littlejs: path.resolve(
					process.cwd(),
					mode === 'production'
						? 'node_modules/littlejsengine/dist/littlejs.esm.min.js'
						: 'node_modules/littlejsengine/dist/littlejs.esm.js'
				),
			},
		},
		plugins: [
			excludePublicFolders(['obsidian', '.obsidian', 'LOCAL']),
			watchPublicMarkdown(),
			firebaseRewritesPlugin(),
			staticHtmlPlugin(),
			allowPrivateNetworkAccess(),
			{
				name: 'html-hash-injector',
				transformIndexHtml(html) {
					return html.replace(/%BUILD_HASH%/g, buildHash);
				},
			},
		],
		server: {
			fs: {
				deny: [
					'.env',
					'.env.*',
					'*.{crt,pem}',
					'**/obsidian/**',
					'**/.obsidian/**',
					'**/LOCAL/**',
					'.vault-nickname',
				],
			},
		},
		define: {
			__BUILD_HASH__: JSON.stringify(buildHash),
		},
		css: {
			transformer: 'lightningcss',
		},
		build: {
			outDir: 'dist',
			emptyOutDir: true,
			cssMinify: 'lightningcss',
			rollupOptions: {
				output: {
					manualChunks(id) {
						if (id.includes('.config.js') || id.includes('.sprites.js')) {
							return 'configs';
						}
					},
				},
			},
		},
	};
});
