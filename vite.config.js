import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

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
 * A Vite plugin to fix the static HTML wrappers generated for blog posts.
 * It extracts the Open Graph meta blocks from the raw HTML files and injects them into the final built `dist/index.html` with correct hashed asset links.
 * @returns {import('vite').Plugin} the vite plugin instance.
 */
function blogStaticHtmlPlugin() {
	return {
		name: 'fix-blog-static-html',
		apply: 'build',
		closeBundle() {
			const distIndexPath = path.resolve('dist', 'index.html');
			const blogDir = path.resolve('dist', 'blog');

			if (!fs.existsSync(distIndexPath) || !fs.existsSync(blogDir)) {
				return;
			}

			const distIndexHtml = fs.readFileSync(distIndexPath, 'utf-8');
			const dates = fs.readdirSync(blogDir).filter((dir) => {
				return fs.statSync(path.join(blogDir, dir)).isDirectory();
			});

			dates.forEach((date) => {
				const postIndexPath = path.join(blogDir, date, 'index.html');
				if (fs.existsSync(postIndexPath)) {
					const rawPostHtml = fs.readFileSync(postIndexPath, 'utf-8');
					const ogMatch = rawPostHtml.match(
						/<!-- OG_META_START -->[\s\S]*?<!-- OG_META_END -->/
					);

					if (ogMatch) {
						// Overwrite the raw scaffolding with the fully bundled Vite scaffolding
						const updatedHtml = distIndexHtml.replace(
							/<!-- OG_META_START -->[\s\S]*?<!-- OG_META_END -->/,
							() => ogMatch[0]
						);
						fs.writeFileSync(postIndexPath, updatedHtml, 'utf-8');
					}
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
			excludePublicFolders(['obsidian', '.obsidian']),
			watchPublicMarkdown(),
			firebaseRewritesPlugin(),
			blogStaticHtmlPlugin(),
			allowPrivateNetworkAccess(),
		],
		server: {
			fs: {
				deny: [
					'.env',
					'.env.*',
					'*.{crt,pem}',
					'**/obsidian/**',
					'**/.obsidian/**',
					'.vault-nickname',
				],
			},
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
						if (id.includes('.config.js')) {
							return 'configs';
						}
					},
				},
			},
		},
	};
});
